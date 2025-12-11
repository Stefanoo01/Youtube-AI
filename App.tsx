import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ScriptUpload from './components/ScriptUpload';
import Generator from './components/Generator';
import Settings from './components/Settings';
import Auth from './components/Auth';
import { Script, AppView, CharacterProfile } from './types';
import { getScripts, getProfile } from './services/storageService';
import { supabase } from './services/supabaseClient';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [profile, setProfile] = useState<CharacterProfile>({ hostName: 'Host' });
  const [loading, setLoading] = useState(true);

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
        return <Dashboard scripts={scripts} onChangeView={setCurrentView} />;
      case AppView.UPLOADS:
        return <ScriptUpload existingScripts={scripts} onRefresh={refreshData} />;
      case AppView.GENERATOR:
        return <Generator existingScripts={scripts} profile={profile} onScriptGenerated={refreshData} />;
      case AppView.SETTINGS:
        return <Settings />;
      default:
        return <Dashboard scripts={scripts} onChangeView={setCurrentView} />;
    }
  };

  return (
    <Layout currentView={currentView} onChangeView={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

export default App;
