import React, { useState, useRef } from 'react';
import { Upload, Trash2, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Script } from '../types';
import { saveScript, deleteScript } from '../services/storageService';

interface ScriptUploadProps {
  existingScripts: Script[];
  onRefresh: () => void;
}

const ScriptUpload: React.FC<ScriptUploadProps> = ({ existingScripts, onRefresh }) => {
  const [dragActive, setDragActive] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [pasteTitle, setPasteTitle] = useState('');
  const [mode, setMode] = useState<'upload' | 'paste'>('upload');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = async (files: FileList) => {
    setLoading(true);
    const promises = Array.from(files).map(file => {
        return new Promise<void>((resolve) => {
            if (file.type === "text/plain") {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    const content = e.target?.result as string;
                    const newScript: Script = {
                        id: '', // DB generates ID
                        title: file.name.replace('.txt', ''),
                        content: content,
                        type: 'uploaded',
                        createdAt: Date.now()
                    };
                    await saveScript(newScript);
                    resolve();
                };
                reader.readAsText(file);
            } else {
                resolve();
            }
        })
    });
    
    await Promise.all(promises);
    setLoading(false);
    onRefresh();
  };

  const handleManualSave = async () => {
    if (!pasteTitle.trim() || !pasteContent.trim()) return;
    
    setLoading(true);
    const newScript: Script = {
      id: '', // DB generates ID
      title: pasteTitle,
      content: pasteContent,
      type: 'uploaded',
      createdAt: Date.now()
    };
    await saveScript(newScript);
    setPasteTitle('');
    setPasteContent('');
    setLoading(false);
    onRefresh();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to remove this training script?')) {
        setLoading(true);
        await deleteScript(id);
        setLoading(false);
        onRefresh();
    }
  };

  const uploadedScripts = existingScripts.filter(s => s.type === 'uploaded');

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-3xl font-bold text-white">Training Scripts</h2>
            <p className="text-slate-400 mt-2">Upload previous scripts to help the AI learn your style, banter, and format.</p>
        </div>
        <div className="flex bg-slate-800 p-1 rounded-lg">
            <button 
                onClick={() => setMode('upload')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'upload' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
                Upload File
            </button>
            <button 
                onClick={() => setMode('paste')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${mode === 'paste' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}
            >
                Paste Text
            </button>
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative">
        {loading && (
            <div className="absolute inset-0 bg-slate-900/80 flex items-center justify-center z-10 rounded-2xl">
                <Loader2 className="animate-spin text-green-500" size={48} />
            </div>
        )}
        
        {mode === 'upload' ? (
            <div 
                className={`border-2 border-dashed rounded-xl h-64 flex flex-col items-center justify-center transition-colors ${dragActive ? 'border-green-500 bg-green-500/10' : 'border-slate-700 hover:border-slate-600'}`}
                onDragEnter={handleDrag} 
                onDragLeave={handleDrag} 
                onDragOver={handleDrag} 
                onDrop={handleDrop}
            >
                <input 
                    ref={fileInputRef}
                    type="file" 
                    accept=".txt" 
                    multiple 
                    className="hidden" 
                    onChange={(e) => e.target.files && handleFiles(e.target.files)} 
                />
                <Upload size={48} className="text-slate-500 mb-4" />
                <p className="text-lg text-slate-300 font-medium">Drag and drop your script files here</p>
                <p className="text-sm text-slate-500 mt-2">Supports .txt files</p>
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-6 px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-slate-700"
                >
                    Browse Files
                </button>
            </div>
        ) : (
            <div className="space-y-4">
                <input 
                    type="text" 
                    placeholder="Script Title (e.g. 'We found a SECRET BASE!')"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500"
                    value={pasteTitle || ''}
                    onChange={(e) => setPasteTitle(e.target.value)}
                />
                <textarea 
                    placeholder="Paste your script content here..."
                    className="w-full h-64 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-green-500 font-mono text-sm"
                    value={pasteContent || ''}
                    onChange={(e) => setPasteContent(e.target.value)}
                />
                <div className="flex justify-end">
                    <button 
                        onClick={handleManualSave}
                        disabled={!pasteTitle || !pasteContent}
                        className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                    >
                        Save Script
                    </button>
                </div>
            </div>
        )}
      </div>

      {/* List of Scripts */}
      <div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <CheckCircle size={20} className="text-green-500 mr-2" />
            Active Training Data ({uploadedScripts.length})
        </h3>
        {uploadedScripts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 bg-slate-900/50 rounded-xl border border-dashed border-slate-800">
                <AlertCircle size={32} className="mx-auto mb-3 opacity-50" />
                <p>No scripts uploaded yet. The AI needs examples to learn your style!</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {uploadedScripts.map((script) => (
                    <div key={script.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-600 transition-all group">
                        <div className="flex justify-between items-start mb-3">
                            <div className="p-2 bg-slate-800 rounded-lg text-green-500">
                                <FileText size={20} />
                            </div>
                            <button 
                                onClick={() => handleDelete(script.id)}
                                className="text-slate-600 hover:text-red-500 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                        <h4 className="font-semibold text-white truncate mb-1" title={script.title}>{script.title}</h4>
                        <p className="text-xs text-slate-500 mb-3">Uploaded: {new Date(script.createdAt).toLocaleDateString()}</p>
                        <div className="text-sm text-slate-400 line-clamp-3 font-mono bg-slate-950 p-2 rounded border border-slate-800">
                            {script.content}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default ScriptUpload;