
import React, { useState, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ScriptUpload from './components/ScriptUpload';
import Generator from './components/Generator';
import Settings from './components/Settings';
import Auth from './components/Auth';
import { Script, AppView, CharacterProfile, ScriptSection } from './types';
import { getScripts, getProfile } from './services/storageService';
import { generateVideoScript } from './services/geminiService';
import { supabase } from './services/supabaseClient';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [profile, setProfile] = useState<CharacterProfile>({ hostName: 'Host' });
  const [loading, setLoading] = useState(true);

  // Persistent Generator State
  const [genPrompt, setGenPrompt] = useState(() => localStorage.getItem('mine_script_draft') || '');
  const [genSections, setGenSections] = useState<ScriptSection[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
          refreshData();
      } else {
          setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) refreshData();
    });

    return () => subscription.unsubscribe();
  }, []);

  // Persist prompt to local storage
  useEffect(() => {
    localStorage.setItem('mine_script_draft', genPrompt);
  }, [genPrompt]);

  const refreshData = async () => {
    try {
        const [loadedScripts, loadedProfile] = await Promise.all([
            getScripts(),
            getProfile()
        ]);
        setScripts(loadedScripts);
        setProfile(loadedProfile);
    } catch (e) {
        console.error("Failed to load data", e);
    } finally {
        setLoading(false);
    }
  };

  const startGeneration = useCallback(async (prompt: string, modelId: string) => {
    if (!prompt.trim() || isGenerating) return;
    
    setIsGenerating(true);
    setGenError('');
    setGenSections([]);
    
    try {
      const profileWithModel = { ...profile, selectedModel: modelId };
      const result = await generateVideoScript(prompt, scripts, profileWithModel);
      const parsedSections = result
        .split(/\n\s*\n/)
        .filter(text => text.trim().length > 0)
        .map(text => ({
          id: Math.random().toString(36).substring(2, 9),
          content: text.trim(),
          isRegenerating: false,
          isEditing: false
        }));
      
      setGenSections(parsedSections);
    } catch (err) {
      setGenError('Failed to generate script. Please try again.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }, [isGenerating, scripts, profile]);

  if (loading) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <Loader2 className="animate-spin text-green-500" size={48} />
        </div>
      );
  }

  if (!session) {
      return <Auth />;
  }

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard scripts={scripts} onChangeView={setCurrentView} onRefresh={refreshData} />;
      case AppView.UPLOADS:
        return <ScriptUpload existingScripts={scripts} onRefresh={refreshData} />;
      case AppView.GENERATOR:
        return (
          <Generator 
            existingScripts={scripts} 
            profile={profile} 
            onScriptGenerated={refreshData}
            prompt={genPrompt}
            setPrompt={setGenPrompt}
            sections={genSections}
            setSections={setGenSections}
            isGenerating={isGenerating}
            onGenerate={startGeneration}
            error={genError}
          />
        );
      case AppView.SETTINGS:
        return <Settings />;
      default:
        return <Dashboard scripts={scripts} onChangeView={setCurrentView} onRefresh={refreshData} />;
    }
  };

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

export default App;
