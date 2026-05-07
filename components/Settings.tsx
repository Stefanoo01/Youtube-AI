
import React, { useState, useEffect } from 'react';
import { Save, User, Loader2, Globe } from 'lucide-react';
import { CharacterProfile } from '../types';
import { getProfile, saveProfile } from '../services/storageService';

const LANGUAGES = [
  { code: 'English', label: 'English' },
  { code: 'Spanish', label: 'Español' },
  { code: 'Italian', label: 'Italiano' },
  { code: 'French', label: 'Français' },
  { code: 'German', label: 'Deutsch' },
  { code: 'Portuguese', label: 'Português' },
  { code: 'Russian', label: 'Русский' },
  { code: 'Japanese', label: '日本語' },
  { code: 'Korean', label: '한국어' },
];

const Settings: React.FC = () => {
  const [profile, setProfile] = useState<CharacterProfile>({ hostName: '', language: 'English' });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
        try {
            const data = await getProfile();
            setProfile(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
        await saveProfile(profile);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    } catch (e) {
        console.error(e);
        alert('Failed to save settings');
    } finally {
        setSaving(false);
    }
  };

  if (loading) {
      return (
          <div className="flex justify-center p-20">
              <Loader2 className="animate-spin text-brand-blue" size={48} />
          </div>
      );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      <div>
        <h2 className="text-4xl font-black text-white tracking-tight">Channel Persona</h2>
        <p className="text-slate-400 mt-3 text-lg">Configure the host personality and language for your AI scripts.</p>
      </div>

      <div className="bg-brand-card border border-slate-800 rounded-[2.5rem] p-10 shadow-2xl">
        <div className="space-y-8">
            <div>
                <label className="block text-slate-400 text-xs font-black uppercase tracking-widest mb-3 flex items-center">
                    <User size={14} className="mr-2 text-brand-blue" />
                    Host Name (Speaker)
                </label>
                <input 
                    type="text" 
                    value={profile.hostName || ''}
                    onChange={(e) => setProfile({...profile, hostName: e.target.value})}
                    className="w-full bg-brand-bg border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-brand-blue transition-all"
                    placeholder="e.g. Watsune"
                />
            </div>

            <div>
                <label className="block text-slate-400 text-xs font-black uppercase tracking-widest mb-3 flex items-center">
                    <Globe size={14} className="mr-2 text-blue-500" />
                    Scripting Language
                </label>
                <div className="relative">
                  <select 
                      value={profile.language || 'English'}
                      onChange={(e) => setProfile({...profile, language: e.target.value})}
                      className="w-full bg-brand-bg border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-brand-blue appearance-none cursor-pointer font-bold"
                  >
                      {LANGUAGES.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                              {lang.label}
                          </option>
                      ))}
                  </select>
                  <div className="absolute right-6 top-1/2 transform -translate-y-1/2 pointer-events-none text-slate-500">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                  </div>
                </div>
            </div>

            <div className="pt-6">
                <button 
                    onClick={handleSave}
                    disabled={saving}
                    className={`w-full flex items-center justify-center space-x-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl ${saved ? 'bg-green-600/20 text-green-500 border border-green-600/30' : 'bg-brand-blue text-white hover:brightness-110'}`}
                >
                    {saving ? <Loader2 className="animate-spin" size={24} /> : <Save size={24} />}
                    <span>{saved ? 'Saved' : 'Save Profile'}</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
