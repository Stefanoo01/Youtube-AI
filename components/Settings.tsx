import React, { useState, useEffect } from "react";
import { Save, User, Loader2 } from "lucide-react";
import { CharacterProfile } from "../types";
import { getProfile, saveProfile } from "../services/storageService";

const Settings: React.FC = () => {
  const [profile, setProfile] = useState<CharacterProfile>({ hostName: "" });
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
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-green-500" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white">Channel Settings</h2>
        <p className="text-slate-400 mt-2">
          Configure the host persona for the AI.
        </p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl">
        <div className="space-y-6">
          <div>
            <label className="block text-slate-300 font-medium mb-2 flex items-center">
              <User size={16} className="mr-2 text-green-500" />
              Host Name (You)
            </label>
            <input
              type="text"
              value={profile.hostName || ""}
              onChange={(e) =>
                setProfile({ ...profile, hostName: e.target.value })
              }
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
              placeholder="e.g. Steve"
            />
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`w-full flex items-center justify-center space-x-2 px-6 py-3 rounded-xl font-bold transition-all ${
                saved
                  ? "bg-green-600/20 text-green-500"
                  : "bg-green-600 text-white hover:bg-green-500 hover:shadow-lg hover:shadow-green-900/20"
              }`}
            >
              {saving ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Save size={20} />
              )}
              <span>{saved ? "Settings Saved" : "Save Configuration"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
