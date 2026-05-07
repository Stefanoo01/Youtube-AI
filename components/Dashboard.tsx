
import React, { useState } from 'react';
import { Script } from '../types';
import { FileText, Sparkles, Clock, X, Copy, Check, Calendar, Type, ChevronRight, Eye, EyeOff, Pencil, Trash2, Save, Loader2, MoreVertical, BookOpen } from 'lucide-react';
import { deleteScript, updateScript } from '../services/storageService';

interface DashboardProps {
  scripts: Script[];
  onChangeView: (view: any) => void;
  onRefresh?: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ scripts, onChangeView, onRefresh }) => {
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [copied, setCopied] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const uploadedCount = scripts.filter(s => s.type === 'uploaded').length;
  const generatedCount = scripts.filter(s => s.type === 'generated').length;
  const recentScripts = [...scripts].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);

  const handleCopy = (text: string) => {
    let contentToCopy = text;
    
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

  const handleEditClick = (script: Script) => {
    setEditTitle(script.title);
    setEditContent(script.content);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedScript) return;
    setIsSaving(true);
    try {
      await updateScript(selectedScript.id, { title: editTitle, content: editContent });
      setSelectedScript({ ...selectedScript, title: editTitle, content: editContent });
      setIsEditing(false);
      if (onRefresh) onRefresh();
    } catch (e) {
      console.error(e);
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Errore nel salvataggio.', type: 'error' }}));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedScript) return;
    if (!confirm('Sei sicuro di voler cancellare questo script?')) return;
    setIsDeleting(true);
    try {
      await deleteScript(selectedScript.id);
      setSelectedScript(null);
      if (onRefresh) onRefresh();
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Script cancellato con successo.' }}));
    } catch (e) {
      console.error(e);
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Errore nella cancellazione.', type: 'error' }}));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConvertToTraining = async () => {
    if (!selectedScript) return;
    try {
      await updateScript(selectedScript.id, { type: 'uploaded' });
      setSelectedScript({ ...selectedScript, type: 'uploaded' });
      setShowDropdown(false);
      if (onRefresh) onRefresh();
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Aggiunto ai Training Data!' }}));
    } catch (e) {
      console.error(e);
      window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Errore durante la conversione.', type: 'error' }}));
    }
  };

  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*|\[.*?\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <span key={i} className="font-bold text-white underline decoration-slate-800 decoration-2 underline-offset-4">{part.slice(2, -2)}</span>;
      } else if (part.startsWith('[') && part.endsWith(']')) {
        if (!showDirections) return null;
        return <span key={i} className="text-brand-accent italic font-medium opacity-70">{part}</span>;
      } else {
        const nameMatch = part.match(/^([A-Za-z0-9_]+):/);
        if (nameMatch) {
          const name = nameMatch[1];
          const rest = part.slice(name.length + 1);
          return (
            <span key={i}>
              <span className="text-brand-blue font-black tracking-tight">{name}:</span>
              <span className="text-slate-200">{rest}</span>
            </span>
          );
        }
        return <span key={i} className="text-slate-200">{part}</span>;
      }
    });
  };

  return (
    <div className="space-y-12">
      <div>
        <h2 className="text-4xl font-bold text-white tracking-tight">Studio Overview</h2>
        <p className="text-slate-400 mt-3 text-lg">Manage your channel's AI personality and content library.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-brand-card p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="flex items-center space-x-5">
            <div className="p-4 bg-brand-blue/10 text-brand-blue rounded-2xl">
              <FileText size={28} />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-black uppercase tracking-widest">Training Data</p>
              <h3 className="text-3xl font-bold text-white mt-1">{uploadedCount}</h3>
            </div>
          </div>
        </div>
        <div className="bg-brand-card p-8 rounded-3xl border border-slate-800 shadow-2xl">
          <div className="flex items-center space-x-5">
            <div className="p-4 bg-purple-500/10 text-purple-400 rounded-2xl">
              <Sparkles size={28} />
            </div>
            <div>
              <p className="text-slate-500 text-xs font-black uppercase tracking-widest">AI Scripts</p>
              <h3 className="text-3xl font-bold text-white mt-1">{generatedCount}</h3>
            </div>
          </div>
        </div>
        <div 
          className="bg-brand-blue p-8 rounded-3xl shadow-2xl flex flex-col justify-between relative overflow-hidden group cursor-pointer transition-all hover:scale-[1.03] active:scale-95" 
          onClick={() => onChangeView('GENERATOR')}
        >
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">New Script</h3>
            <p className="text-blue-100 text-sm opacity-80">Launch the studio</p>
          </div>
          <div className="mt-6 flex justify-between items-center">
            <Sparkles className="text-white" />
            <ChevronRight className="text-white group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-white flex items-center">
          <Clock size={24} className="mr-3 text-slate-600" />
          Recent Activity
        </h3>
        <div className="bg-brand-card border border-slate-800 rounded-[2rem] overflow-hidden shadow-2xl">
          {recentScripts.length > 0 ? (
            <div className="divide-y divide-slate-800/50">
              {recentScripts.map((script) => (
                <button 
                  key={script.id} 
                  onClick={() => setSelectedScript(script)}
                  className="w-full text-left p-6 hover:bg-slate-800/30 transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center space-x-5">
                    <div className={`w-3 h-3 rounded-full ${script.type === 'uploaded' ? 'bg-brand-blue shadow-[0_0_10px_#1681a3]' : 'bg-purple-500 shadow-[0_0_10px_#a855f7]'}`}></div>
                    <div>
                      <h4 className="font-bold text-white group-hover:text-brand-blue transition-colors text-lg">{script.title}</h4>
                      <p className="text-xs text-slate-500 font-medium mt-1 uppercase tracking-tighter">
                        {script.type === 'uploaded' ? 'TRAINING' : 'AI SCRIPT'} 
                        <span className="mx-2 opacity-30">|</span> 
                        {new Date(script.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <span className="text-[10px] font-black tracking-widest bg-brand-bg text-slate-400 px-3 py-1.5 rounded-lg border border-slate-800 uppercase">
                      {script.content.trim().split(/\s+/).length} Words
                    </span>
                    <FileText size={20} className="text-slate-600 group-hover:text-slate-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-20 text-center text-slate-600">
              <FileText size={64} className="mx-auto mb-6 opacity-5" />
              <p className="text-xl font-medium">Your library is currently empty.</p>
            </div>
          )}
        </div>
      </div>

      {selectedScript && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 animate-in fade-in zoom-in-95 duration-200">
          <div 
            className="absolute inset-0 bg-black/95 backdrop-blur-xl" 
            onClick={() => setSelectedScript(null)}
          ></div>
          <div className="relative w-full max-w-5xl bg-brand-card border border-slate-800 rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="p-10 border-b border-slate-800/50 flex justify-between items-start bg-brand-card/50">
              <div className="space-y-3 flex-1 mr-8">
                <div className="flex items-center space-x-4">
                  {isEditing ? (
                    <input 
                      value={editTitle} 
                      onChange={e => setEditTitle(e.target.value)} 
                      className="text-3xl font-black text-white leading-none tracking-tight bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 w-full focus:outline-none focus:border-brand-blue"
                    />
                  ) : (
                    <h3 className="text-3xl font-black text-white leading-none tracking-tight">{selectedScript.title}</h3>
                  )}
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                    selectedScript.type === 'uploaded' 
                      ? 'bg-brand-blue/10 text-brand-blue border-brand-blue/30' 
                      : 'bg-purple-500/10 text-purple-400 border-purple-500/30'
                  }`}>
                    {selectedScript.type}
                  </span>
                </div>
                <div className="flex items-center space-x-8 text-xs font-bold text-slate-500 uppercase tracking-widest">
                  <span className="flex items-center"><Calendar size={14} className="mr-2" /> {new Date(selectedScript.createdAt).toLocaleDateString()}</span>
                  <span className="flex items-center"><Type size={14} className="mr-2" /> {selectedScript.content.trim().split(/\s+/).length} words</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setShowDirections(!showDirections)}
                  className={`flex items-center space-x-3 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${showDirections ? 'bg-brand-accent/10 text-brand-accent border-brand-accent/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}
                >
                  {showDirections ? <Eye size={18} /> : <EyeOff size={18} />}
                  <span>{showDirections ? 'Visible' : 'Hidden'}</span>
                </button>
                <div className="w-[1px] h-12 bg-slate-800 mx-2"></div>
                {!isEditing && (
                  <div className="relative">
                    <button 
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="p-4 bg-brand-bg hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all border border-slate-800"
                    >
                      <MoreVertical size={28} />
                    </button>
                    
                    {showDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-40"
                          onClick={() => setShowDropdown(false)}
                        ></div>
                        <div className="absolute right-0 top-full mt-2 w-64 bg-brand-card border border-slate-700 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                          <button 
                            onClick={() => { handleCopy(selectedScript.content); setShowDropdown(false); }}
                            className="w-full text-left px-5 py-4 text-slate-300 hover:bg-slate-800 flex items-center space-x-3 transition-colors font-medium"
                          >
                            {copied ? <Check size={18} className="text-brand-blue" /> : <Copy size={18} />}
                            <span>{copied ? 'Copied!' : 'Copy Script'}</span>
                          </button>
                          
                          {selectedScript.type === 'generated' && (
                            <button 
                              onClick={handleConvertToTraining}
                              className="w-full text-left px-5 py-4 text-brand-blue hover:bg-brand-blue/10 flex items-center space-x-3 transition-colors font-medium"
                            >
                              <BookOpen size={18} />
                              <span>Use as Training Data</span>
                            </button>
                          )}

                          <button 
                            onClick={() => { handleEditClick(selectedScript); setShowDropdown(false); }}
                            className="w-full text-left px-5 py-4 text-slate-300 hover:bg-slate-800 flex items-center space-x-3 transition-colors font-medium"
                          >
                            <Pencil size={18} />
                            <span>Edit Script</span>
                          </button>
                          
                          <div className="border-t border-slate-700 my-1"></div>
                          
                          <button 
                            onClick={() => { handleDelete(); setShowDropdown(false); }}
                            disabled={isDeleting}
                            className="w-full text-left px-5 py-4 text-red-400 hover:bg-red-400/10 flex items-center space-x-3 transition-colors disabled:opacity-50 font-medium"
                          >
                            {isDeleting ? <Loader2 className="animate-spin" size={18} /> : <Trash2 size={18} />}
                            <span>Delete Script</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
                <button 
                  onClick={() => { setSelectedScript(null); setIsEditing(false); }}
                  className="p-4 bg-brand-bg hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all border border-slate-800 ml-2"
                >
                  <X size={28} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 bg-brand-bg font-sans text-lg leading-relaxed">
              <div className="max-w-4xl mx-auto whitespace-pre-wrap">
                {isEditing ? (
                  <textarea
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    className="w-full h-[50vh] bg-slate-900 border border-slate-700 rounded-2xl p-6 text-slate-100 focus:outline-none focus:border-brand-blue resize-none"
                    spellCheck={false}
                  />
                ) : (
                  renderFormattedText(selectedScript.content)
                )}
              </div>
            </div>

            <div className="p-8 border-t border-slate-800/50 bg-brand-card/50 flex justify-end space-x-4">
              {isEditing && (
                <button 
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="px-10 py-4 bg-brand-blue hover:brightness-110 text-white rounded-2xl font-black uppercase tracking-widest transition-all flex items-center shadow-lg disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin mr-2" size={20} /> : <Save className="mr-2" size={20} />}
                  Save Changes
                </button>
              )}
              <button 
                onClick={() => { setSelectedScript(null); setIsEditing(false); }}
                className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black uppercase tracking-widest transition-all"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
