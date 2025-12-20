
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Sparkles, LogIn, UserPlus, AlertCircle } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-brand-card border border-slate-800 rounded-[3rem] p-12 shadow-2xl">
        <div className="flex flex-col items-center mb-12">
            <div className="w-20 h-20 bg-brand-blue rounded-3xl shadow-xl flex items-center justify-center mb-6">
                <span className="text-white font-black text-4xl">M</span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter">MineScript</h1>
            <p className="text-slate-500 mt-2 font-bold uppercase tracking-widest text-[10px]">AI Video Studio</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Email Access</label>
            <input
              className="w-full bg-brand-bg border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-brand-blue transition-all"
              type="email"
              placeholder="creatore@minecraft.it"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 px-1">Security Key</label>
            <input
              className="w-full bg-brand-bg border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-brand-blue transition-all"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <div className="flex items-center space-x-3 text-red-400 bg-red-950/20 p-4 rounded-2xl text-xs border border-red-900/30">
                <AlertCircle size={16} />
                <span className="font-bold">{error}</span>
            </div>
          )}

          <button
            className="w-full bg-brand-blue hover:brightness-110 text-white font-black uppercase tracking-widest py-4 rounded-2xl transition-all shadow-xl shadow-brand-blue/20 flex items-center justify-center space-x-3 active:scale-[0.97]"
            disabled={loading}
          >
            {loading ? (
                <span className="animate-pulse">Sincronizzazione...</span>
            ) : (
                <>
                    {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                    <span>{isLogin ? 'Enter Studio' : 'Create ID'}</span>
                </>
            )}
          </button>
        </form>
        
        <div className="mt-10 text-center">
            <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-xs font-bold text-slate-500 hover:text-white transition-colors"
            >
                {isLogin ? "NEW CREATOR? START HERE" : "ALREADY REGISTERED? LOGIN"}
            </button>
        </div>
      </div>
    </div>
  );
}
