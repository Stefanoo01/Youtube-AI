import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Save, RefreshCw, Copy, Check, Video, MessageSquare, FileText, Pencil, Wand2, X } from 'lucide-react';
import { Script, CharacterProfile } from '../types';
import { generateVideoScript, regenerateScriptSection } from '../services/geminiService';
import { saveScript } from '../services/storageService';

interface GeneratorProps {
  existingScripts: Script[];
  profile: CharacterProfile;
  onScriptGenerated: () => void;
}

interface ScriptSection {
  id: string;
  content: string;
  isRegenerating: boolean;
  isEditing: boolean;
}

const Generator: React.FC<GeneratorProps> = ({ existingScripts, profile, onScriptGenerated }) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [sections, setSections] = useState<ScriptSection[]>([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError('');
    setSaved(false);
    setSections([]);
    
    try {
      const result = await generateVideoScript(prompt, existingScripts, profile);
      // Split result by double newlines to create paragraphs
      const parsedSections = result
        .split(/\n\s*\n/)
        .filter(text => text.trim().length > 0)
        .map(text => ({
          id: generateId(),
          content: text.trim(),
          isRegenerating: false,
          isEditing: false
        }));
      
      setSections(parsedSections);
    } catch (err) {
      setError('Failed to generate script. Please try again.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateSection = async (id: string) => {
    const sectionIndex = sections.findIndex(s => s.id === id);
    if (sectionIndex === -1) return;

    const newSections = [...sections];
    newSections[sectionIndex].isRegenerating = true;
    newSections[sectionIndex].isEditing = false;
    setSections(newSections);

    try {
      const newContent = await regenerateScriptSection(sections[sectionIndex].content, profile);
      
      const updatedSections = [...sections];
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        content: newContent,
        isRegenerating: false
      };
      setSections(updatedSections);
    } catch (e) {
      console.error(e);
      const updatedSections = [...sections];
      updatedSections[sectionIndex].isRegenerating = false;
      setSections(updatedSections);
    }
  };

  const handleUpdateSection = (id: string, newContent: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, content: newContent } : s));
    setSaved(false);
  };

  const toggleEditSection = (id: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, isEditing: !s.isEditing } : s));
  };

  const handleDeleteSection = (id: string) => {
    setSections(sections.filter(s => s.id !== id));
    setSaved(false);
  };

  const getFullContent = () => sections.map(s => s.content).join('\n\n');

  const handleSave = async () => {
    const fullContent = getFullContent();
    if (!fullContent) return;
    
    setIsSaving(true);
    const newScript: Script = {
        id: '', // DB generates ID
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
    navigator.clipboard.writeText(getFullContent());
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
                <li>Review each section on the right to tweak the dialogue.</li>
            </ul>
        </div>
      </div>

      {/* Output Column */}
      <div className="lg:col-span-2 flex flex-col h-[600px] lg:h-auto">
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-slate-800 bg-slate-900 flex justify-between items-center z-10 sticky top-0">
                <div className="flex items-center space-x-2 text-slate-300">
                    <Video size={18} />
                    <span className="font-semibold">Generated Script</span>
                    {sections.length > 0 && (
                      <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded ml-2">
                        {sections.length} Sections
                      </span>
                    )}
                </div>
                {sections.length > 0 && (
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
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-950 space-y-6">
                {sections.length > 0 ? (
                    sections.map((section, index) => (
                      <ScriptSectionCard 
                        key={section.id}
                        section={section}
                        index={index}
                        onUpdate={handleUpdateSection}
                        onToggleEdit={toggleEditSection}
                        onRegenerate={handleRegenerateSection}
                        onDelete={handleDeleteSection}
                      />
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600">
                        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-4 border border-slate-800">
                            <FileText size={40} className="opacity-20" />
                        </div>
                        <p>Your generated script will be divided into editable sections here.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

// Sub-component for individual cards to handle auto-resize and specific rendering logic
const ScriptSectionCard: React.FC<{
    section: ScriptSection;
    index: number;
    onUpdate: (id: string, content: string) => void;
    onToggleEdit: (id: string) => void;
    onRegenerate: (id: string) => void;
    onDelete: (id: string) => void;
}> = ({ section, index, onUpdate, onToggleEdit, onRegenerate, onDelete }) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Auto-resize textarea logic
    useEffect(() => {
        if (section.isEditing && textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
        }
    }, [section.isEditing, section.content]);

    // Fancy text renderer
    const renderFormattedText = (text: string) => {
        // CLEANUP: Force stage directions to be inline for display by removing surrounding newlines
        // Replace newline+bracket with space+bracket
        const inlineText = text
            .replace(/\n\s*(\[)/g, ' $1')
            .replace(/(\])\s*\n/g, '$1 ');

        // We split by standard markdown bold syntax **word**
        const parts = inlineText.split(/(\*\*.*?\*\*|\[.*?\])/g);
        
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                // Bold text
                return <span key={i} className="font-bold text-white">{part.slice(2, -2)}</span>;
            } else if (part.startsWith('[') && part.endsWith(']')) {
                // Stage Directions (Yellow/Orange)
                return <span key={i} className="text-amber-400 italic font-medium">{part}</span>;
            } else {
                // Standard text - check for Speaker Name (e.g. "Steve:")
                const nameMatch = part.match(/^([A-Za-z0-9_]+):/);
                if (nameMatch) {
                   const name = nameMatch[1];
                   const rest = part.slice(name.length + 1);
                   return (
                       <span key={i}>
                           <span className="text-green-500 font-bold">{name}:</span>
                           <span className="text-slate-300">{rest}</span>
                       </span>
                   );
                }
                return <span key={i} className="text-slate-300">{part}</span>;
            }
        });
    };

    return (
        <div 
            className={`group relative bg-slate-900 border rounded-xl p-1 transition-all hover:shadow-lg ${section.isEditing ? 'border-green-600 ring-1 ring-green-600/50' : 'border-slate-800 hover:border-slate-600'}`}
        >
            {/* Toolbar */}
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 z-10 bg-slate-900/90 rounded-bl-xl border-l border-b border-slate-800">
               <button 
                  onClick={() => onToggleEdit(section.id)}
                  className={`p-1.5 rounded-lg transition-colors ${section.isEditing ? 'text-green-500 bg-green-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
                  title={section.isEditing ? "Finish Editing" : "Edit Text"}
               >
                  {section.isEditing ? <Check size={14} /> : <Pencil size={14} />}
               </button>
               <button 
                  onClick={() => onRegenerate(section.id)}
                  disabled={section.isRegenerating || section.isEditing}
                  className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-30"
                  title="Regenerate this section"
               >
                  <Wand2 size={14} />
               </button>
               <button 
                  onClick={() => onDelete(section.id)}
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete section"
               >
                  <X size={14} />
               </button>
            </div>
            
            <div className="absolute top-4 left-4 text-slate-600 text-xs font-mono select-none pointer-events-none">
              #{index + 1}
            </div>

            {section.isRegenerating ? (
               <div className="min-h-[100px] flex flex-col items-center justify-center text-slate-500 space-y-2 p-8">
                  <RefreshCw className="animate-spin text-blue-500" size={24} />
                  <span className="text-sm">Rewriting section...</span>
               </div>
            ) : (
                <div className="p-4 pl-10 min-h-[80px]">
                    {section.isEditing ? (
                        <textarea
                            ref={textareaRef}
                            value={section.content}
                            onChange={(e) => onUpdate(section.id, e.target.value)}
                            className="w-full bg-transparent text-slate-200 font-mono text-sm leading-relaxed focus:outline-none resize-none overflow-hidden"
                            placeholder="Type here..."
                            spellCheck={false}
                        />
                    ) : (
                        <div className="whitespace-pre-wrap font-sans text-sm leading-7">
                            {renderFormattedText(section.content)}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Generator;