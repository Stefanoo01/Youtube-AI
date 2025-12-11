import React from 'react';
import { Script } from '../types';
import { FileText, Sparkles, Clock } from 'lucide-react';

interface DashboardProps {
  scripts: Script[];
  onChangeView: (view: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ scripts, onChangeView }) => {
  const uploadedCount = scripts.filter(s => s.type === 'uploaded').length;
  const generatedCount = scripts.filter(s => s.type === 'generated').length;
  const recentScripts = scripts.sort((a, b) => b.createdAt - a.createdAt).slice(0, 4);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-white">Welcome back, Creator!</h2>
        <p className="text-slate-400 mt-2">Ready to create your next viral Minecraft video?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
                    <FileText size={24} />
                </div>
                <div>
                    <p className="text-slate-400 text-sm font-medium">Training Scripts</p>
                    <h3 className="text-2xl font-bold text-white">{uploadedCount}</h3>
                </div>
            </div>
        </div>
        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg">
            <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-500/10 text-purple-500 rounded-xl">
                    <Sparkles size={24} />
                </div>
                <div>
                    <p className="text-slate-400 text-sm font-medium">Generated Scripts</p>
                    <h3 className="text-2xl font-bold text-white">{generatedCount}</h3>
                </div>
            </div>
        </div>
        <div className="bg-gradient-to-br from-green-600 to-emerald-800 p-6 rounded-2xl shadow-lg flex flex-col justify-between relative overflow-hidden group cursor-pointer" onClick={() => onChangeView('GENERATOR')}>
             <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:bg-white/20 transition-all"></div>
             <div>
                <h3 className="text-xl font-bold text-white mb-1">Create New Script</h3>
                <p className="text-green-100 text-sm">Start a new idea with AI</p>
             </div>
             <div className="mt-4 flex justify-end">
                <Sparkles className="text-white" />
             </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold text-white mb-4 flex items-center">
            <Clock size={20} className="mr-2 text-slate-500" />
            Recent Activity
        </h3>
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            {recentScripts.length > 0 ? (
                <div className="divide-y divide-slate-800">
                    {recentScripts.map((script) => (
                        <div key={script.id} className="p-4 hover:bg-slate-800/50 transition-colors flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                                <div className={`w-2 h-2 rounded-full ${script.type === 'uploaded' ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                                <div>
                                    <h4 className="font-medium text-white">{script.title}</h4>
                                    <p className="text-xs text-slate-500">
                                        {script.type === 'uploaded' ? 'Uploaded Training Data' : 'AI Generated'} • {new Date(script.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                            <span className="text-xs bg-slate-800 text-slate-400 px-2 py-1 rounded">
                                {script.content.length > 500 ? Math.ceil(script.content.length / 1000) + ' min read' : 'Short'}
                            </span>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="p-8 text-center text-slate-500">
                    No activity yet. Upload a script or generate one to get started!
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
