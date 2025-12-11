import React, { useState } from 'react';
import { Sparkles, Save, RefreshCw, Copy, Check, Video, MessageSquare, FileText } from 'lucide-react';
import { Script, CharacterProfile } from '../types';
import { generateVideoScript } from '../services/geminiService';
import { saveScript } from '../services/storageService';

interface GeneratorProps {
  existingScripts: Script[];
  profile: CharacterProfile;
  onScriptGenerated: () => void;
}

const Generator: React.FC<GeneratorProps> = ({ existingScripts, profile, onScriptGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError('');
    setSaved(false);
    
    try {
      const result = await generateVideoScript(prompt, existingScripts, profile);
      setGeneratedContent(result);
    } catch (err) {
      setError('Failed to generate script. Please try again.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async () => {
    if (!generatedContent) return;
    
    setIsSaving(true);
    const newScript: Script = {
        id: '', // DB generates ID
        title: `AI: ${prompt.substring(0, 30)}...`,
        content: generatedContent,
        type: 'generated',
        createdAt: Date.now()
    };
    await saveScript(newScript);
    onScriptGenerated();
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const uploadedCount = existingScripts.filter(s => s.type === 'uploaded').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
      {/* Input Column */}
      <div className="lg:col-span-1 space-y-6">
        <div>
            <h2 className="text-3xl font-bold text-white">Script Generator</h2>
            <p className="text-slate-400 mt-2">Describe your video idea, and let the AI write the dialogue for you.</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center space-x-2 mb-4 text-green-400 text-sm font-medium bg-green-900/20 p-2 rounded-lg inline-block">
                <Sparkles size={16} />
                <span>Learning from {uploadedCount} uploaded scripts</span>
            </div>
            
            <label className="block text-slate-300 font-medium mb-2">Video Concept / Topic</label>
            <textarea 
                className="w-full h-40 bg-slate-950 border border-slate-700 rounded-xl p-4 text-white focus:outline-none focus:border-green-500 transition-colors resize-none"
                placeholder="e.g. We try to survive 100 days in a Superflat world but every day the mobs get 2x bigger..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
            />
            
            <button
                onClick={handleGenerate}
                disabled={isGenerating || !prompt.trim()}
                className="w-full mt-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold shadow-lg shadow-green-900/30 flex items-center justify-center space-x-2 transition-all transform active:scale-95"
            >
                {isGenerating ? (
                    <>
                        <RefreshCw className="animate-spin" size={20} />
                        <span>Generating Magic...</span>
                    </>
                ) : (
                    <>
                        <Sparkles size={20} />
                        <span>Generate Script</span>
                    </>
                )}
            </button>
            
            {error && (
                <div className="mt-4 p-3 bg-red-900/20 border border-red-800 text-red-400 rounded-lg text-sm">
                    {error}
                </div>
            )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-white font-semibold mb-3 flex items-center">
                <MessageSquare size={18} className="mr-2 text-slate-400" />
                Tips for better results
            </h3>
            <ul className="text-sm text-slate-400 space-y-2 list-disc pl-4">
                <li>Be specific about the "Hook" of the video.</li>
                <li>Mention if there's a specific challenge or mod involved.</li>
                <li>Upload at least 3 previous scripts for better style matching.</li>
                <li>Ensure character names are set correctly in Settings.</li>
            </ul>
        </div>
      </div>

      {/* Output Column */}
      <div className="lg:col-span-2 flex flex-col h-[600px] lg:h-auto">
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center">
                <div className="flex items-center space-x-2 text-slate-300">
                    <Video size={18} />
                    <span className="font-semibold">Generated Script</span>
                </div>
                {generatedContent && (
                    <div className="flex space-x-2">
                        <button 
                            onClick={handleCopy}
                            className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                            title="Copy to Clipboard"
                        >
                            {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={saved || isSaving}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${saved ? 'bg-green-600/20 text-green-500' : 'bg-green-600 text-white hover:bg-green-500'}`}
                        >
                            {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                            <span>{saved ? 'Saved!' : 'Save Script'}</span>
                        </button>
                    </div>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
                {generatedContent ? (
                    <div className="prose prose-invert max-w-none font-mono text-sm leading-relaxed whitespace-pre-wrap">
                        {generatedContent}
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600">
                        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800">
                            <FileText size={40} className="opacity-20" />
                        </div>
                        <p>Your generated script will appear here.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default Generator;
