
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Save, RefreshCw, Copy, Check, Video, MessageSquare, FileText, Pencil, Wand2, X, Eye, EyeOff } from 'lucide-react';
import { Script, CharacterProfile, ScriptSection } from '../types';
import { regenerateScriptSection } from '../services/geminiService';
import { saveScript } from '../services/storageService';

interface GeneratorProps {
  existingScripts: Script[];
  profile: CharacterProfile;
  onScriptGenerated: () => void;
  // State lifted to App
  prompt: string;
  setPrompt: (val: string) => void;
  sections: ScriptSection[];
  setSections: React.Dispatch<React.SetStateAction<ScriptSection[]>>;
  isGenerating: boolean;
  onGenerate: (prompt: string) => void;
  error: string;
}

const Generator: React.FC<GeneratorProps> = ({ 
    existingScripts, 
    profile, 
    onScriptGenerated,
    prompt,
    setPrompt,
    sections,
    setSections,
    isGenerating,
    onGenerate,
    error
}) => {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDirections, setShowDirections] = useState(true);

  const handleRegenerateSection = async (id: string) => {
    const sectionIndex = sections.findIndex(s => s.id === id);
    if (sectionIndex === -1) return;

    setSections(prev => prev.map(s => s.id === id ? { ...s, isRegenerating: true, isEditing: false } : s));

    try {
      const newContent = await regenerateScriptSection(sections[sectionIndex].content, profile);
      setSections(prev => prev.map(s => s.id === id ? { 
        ...s, 
        content: newContent, 
        isRegenerating: false 
      } : s));
    } catch (e) {
      console.error(e);
      setSections(prev => prev.map(s => s.id === id ? { ...s, isRegenerating: false } : s));
    }
  };

  const handleUpdateSection = (id: string, newContent: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, content: newContent } : s));
    setSaved(false);
  };

  const toggleEditSection = (id: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, isEditing: !s.isEditing } : s));
  };

  const handleDeleteSection = (id: string) => {
    setSections(prev => prev.filter(s => s.id !== id));
    setSaved(false);
  };

  const getFullContent = () => sections.map(s => s.content).join('\n\n');

  const handleSave = async () => {
    const fullContent = getFullContent();
    if (!fullContent) return;
    
    setIsSaving(true);
    const newScript: Script = {
        id: '',
        title: `AI: ${prompt.substring(0, 30)}...`,
        content: fullContent,
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
    let contentToCopy = getFullContent();
    
    if (!showDirections) {
      contentToCopy = contentToCopy
        .replace(/\[.*?\]/g, '')
        .replace(/  +/g, ' ')
        .split('\n')
        .map(line => line.trim())
        .join('\n')
        .trim();
    }

    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const uploadedCount = existingScripts.filter(s => s.type === 'uploaded').length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
      <div className="lg:col-span-4 space-y-8">
        <div>
            <h2 className="text-4xl font-bold text-white tracking-tight">Generator</h2>
            <p className="text-slate-400 mt-3 text-lg">Describe your video idea.</p>
        </div>

        <div className="bg-brand-card border border-slate-800/60 rounded-3xl p-8 shadow-2xl">
            <div className="inline-flex items-center space-x-2 mb-8 text-brand-blue text-xs font-bold uppercase tracking-widest bg-brand-blue/10 border border-brand-blue/20 px-3 py-1.5 rounded-full">
                <Sparkles size={14} />
                <span>Style: {uploadedCount} examples</span>
            </div>
            
            <div className="space-y-4">
              <label className="block text-slate-300 font-semibold">Video Concept</label>
              <textarea 
                  className="w-full h-48 bg-brand-bg border border-slate-800 rounded-2xl p-5 text-white focus:outline-none focus:border-brand-blue transition-all resize-none shadow-inner"
                  placeholder="What is this video about?"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  disabled={isGenerating}
              />
              
              <button
                  onClick={() => onGenerate(prompt)}
                  disabled={isGenerating || !prompt.trim()}
                  className="w-full bg-brand-blue hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center space-x-2 transition-all active:scale-[0.98]"
              >
                  {isGenerating ? (
                      <>
                          <RefreshCw className="animate-spin" size={20} />
                          <span>Generating...</span>
                      </>
                  ) : (
                      <>
                          <Sparkles size={20} />
                          <span>Generate Script</span>
                      </>
                  )}
              </button>
            </div>
            
            {error && (
                <div className="mt-6 p-4 bg-red-950/20 border border-red-800/30 text-red-400 rounded-2xl text-sm">
                    {error}
                </div>
            )}
        </div>

        <div className="bg-brand-card/50 border border-slate-800/40 rounded-3xl p-8">
            <h3 className="text-white font-bold mb-4 flex items-center">
                <MessageSquare size={20} className="mr-3 text-brand-blue" />
                Tips
            </h3>
            <ul className="text-sm text-slate-400 space-y-3">
                <li className="flex items-start"><span className="text-brand-blue mr-3 font-bold">•</span> Be specific about the "Hook".</li>
                <li className="flex items-start"><span className="text-brand-blue mr-3 font-bold">•</span> Mention specific mods or challenges.</li>
            </ul>
        </div>
      </div>

      <div className="lg:col-span-8 flex flex-col">
        <div className="flex-1 bg-brand-card border border-slate-800/60 rounded-[2.5rem] overflow-hidden flex flex-col shadow-2xl min-h-[700px]">
            <div className="p-6 border-b border-slate-800/80 bg-brand-card/80 backdrop-blur-md flex justify-between items-center z-10 sticky top-0">
                <div className="flex items-center space-x-3 text-slate-200">
                    <Video size={20} className="text-slate-500" />
                    <span className="font-bold text-lg">Studio Preview</span>
                </div>
                {(sections.length > 0 || isGenerating) && (
                    <div className="flex space-x-3 items-center">
                        <button 
                            onClick={() => setShowDirections(!showDirections)}
                            className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${showDirections ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
                        >
                            {showDirections ? <Eye size={14} /> : <EyeOff size={14} />}
                            <span className="hidden sm:inline">Directions</span>
                        </button>
                        <div className="w-[1px] h-6 bg-slate-800 mx-1"></div>
                        <button 
                            onClick={handleCopy}
                            disabled={isGenerating}
                            className="p-2.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all border border-slate-800 disabled:opacity-30"
                        >
                            {copied ? <Check size={20} className="text-brand-blue" /> : <Copy size={20} />}
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={saved || isSaving || isGenerating || sections.length === 0}
                            className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg ${saved ? 'bg-green-600/20 text-green-500' : 'bg-brand-blue text-white hover:brightness-110 disabled:opacity-30'}`}
                        >
                            {isSaving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                            <span>{saved ? 'Saved!' : 'Save'}</span>
                        </button>
                    </div>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-brand-bg/40 space-y-6 pb-20">
                {isGenerating && sections.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 py-40">
                         <RefreshCw className="animate-spin text-brand-blue mb-6" size={48} />
                         <p className="text-xl font-bold tracking-tight">AI is crafting your script...</p>
                         <p className="text-sm text-slate-500 mt-2">You can navigate away; we'll keep working.</p>
                    </div>
                ) : sections.length > 0 ? (
                    sections.map((section, index) => (
                      <ScriptSectionCard 
                        key={section.id}
                        section={section}
                        index={index}
                        showDirections={showDirections}
                        onUpdate={handleUpdateSection}
                        onToggleEdit={toggleEditSection}
                        onRegenerate={handleRegenerateSection}
                        onDelete={handleDeleteSection}
                      />
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-40 py-20">
                        <div className="w-24 h-24 bg-brand-card rounded-full flex items-center justify-center mb-6 border border-slate-800/50">
                            <FileText size={48} />
                        </div>
                        <p className="text-lg font-medium tracking-tight">Describe your idea to start...</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

const ScriptSectionCard: React.FC<{
    section: ScriptSection;
    index: number;
    showDirections: boolean;
    onUpdate: (id: string, content: string) => void;
    onToggleEdit: (id: string) => void;
    onRegenerate: (id: string) => void;
    onDelete: (id: string) => void;
}> = ({ section, index, showDirections, onUpdate, onToggleEdit, onRegenerate, onDelete }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (section.isEditing && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [section.isEditing, section.content]);

    const renderFormattedText = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*|\[.*?\])/g);
        
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <span key={i} className="font-bold text-white underline decoration-slate-700 decoration-2 underline-offset-4">{part.slice(2, -2)}</span>;
            } else if (part.startsWith('[') && part.endsWith(']')) {
                if (!showDirections) return null;
                return <span key={i} className="text-brand-accent italic font-medium">{part}</span>;
            } else {
                const nameMatch = part.match(/^([A-Za-z0-9_]+):/);
                if (nameMatch) {
                   const name = nameMatch[1];
                   const rest = part.slice(name.length + 1);
                   return (
                       <span key={i}>
                           <span className="text-brand-blue font-black tracking-tight">{name}:</span>
                           <span className="text-slate-100">{rest}</span>
                       </span>
                   );
                }
                return <span key={i} className="text-slate-100">{part}</span>;
            }
        });
    };

    return (
        <div 
            className={`group relative bg-brand-card/30 border border-slate-800/40 rounded-2xl p-6 transition-all ${section.isEditing ? 'ring-2 ring-brand-blue/50 border-brand-blue bg-brand-card/60' : 'hover:border-slate-700 shadow-xl'}`}
        >
            <div className="absolute top-4 left-4 text-slate-600 text-[10px] font-black tracking-tighter select-none pointer-events-none opacity-40">
              #{index + 1}
            </div>

            <div className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 z-10">
               <button 
                  onClick={() => onToggleEdit(section.id)}
                  className={`p-2 rounded-lg transition-all ${section.isEditing ? 'text-brand-blue bg-brand-blue/10' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
               >
                  {section.isEditing ? <Check size={16} /> : <Pencil size={16} />}
               </button>
               <button 
                  onClick={() => onRegenerate(section.id)}
                  disabled={section.isRegenerating || section.isEditing}
                  className="p-2 text-slate-500 hover:text-brand-blue hover:bg-brand-blue/10 rounded-lg transition-all disabled:opacity-30"
               >
                  <Wand2 size={16} />
               </button>
               <button 
                  onClick={() => onDelete(section.id)}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all"
               >
                  <X size={16} />
               </button>
            </div>

            {section.isRegenerating ? (
               <div className="min-h-[100px] flex flex-col items-center justify-center text-slate-500 space-y-4 py-4">
                  <RefreshCw className="animate-spin text-brand-blue" size={28} />
                  <span className="text-xs font-bold tracking-widest uppercase">Rewriting...</span>
               </div>
            ) : (
                <div className="mt-1">
                    {section.isEditing ? (
                        <textarea
                            ref={textareaRef}
                            value={section.content}
                            onChange={(e) => onUpdate(section.id, e.target.value)}
                            className="w-full bg-transparent text-slate-100 font-mono text-sm leading-relaxed focus:outline-none resize-none overflow-hidden"
                            placeholder="Type here..."
                            spellCheck={false}
                        />
                    ) : (
                        <div className="whitespace-pre-wrap font-sans text-base leading-relaxed tracking-wide">
                            {renderFormattedText(section.content)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Generator;
