
import React from 'react';
import { LayoutDashboard, FileText, Sparkles, Settings, Menu, X, LogOut } from 'lucide-react';
import { AppView } from '../types';
import { supabase } from '../services/supabaseClient';
import { ToastNotification } from './ToastNotification';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onChangeView: (view: AppView) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onChangeView }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const NavItem = ({ view, icon: Icon, label }: { view: AppView; icon: any; label: string }) => (
    <button
      onClick={() => {
        onChangeView(view);
        setIsMobileMenuOpen(false);
      }}
      className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg transition-all duration-200 ${
        currentView === view
          ? 'bg-brand-blue/10 text-brand-blue border border-brand-blue/30 shadow-sm'
          : 'text-slate-400 hover:bg-brand-card hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden flex justify-between items-center p-4 bg-brand-card border-b border-slate-800">
        <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-brand-blue rounded flex items-center justify-center">
                <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">MineScript</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-brand-bg border-r border-slate-800/50 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center space-x-3 mb-12">
            <div className="w-10 h-10 bg-brand-blue rounded-lg shadow-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">M</span>
            </div>
            <div>
                <h1 className="text-xl font-bold text-white tracking-tight">MineScript</h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em]">AI STUDIO</p>
            </div>
          </div>

          <nav className="space-y-1.5 flex-1">
            <NavItem view={AppView.DASHBOARD} icon={LayoutDashboard} label="Dashboard" />
            <NavItem view={AppView.UPLOADS} icon={FileText} label="Training Scripts" />
            <NavItem view={AppView.GENERATOR} icon={Sparkles} label="Script Generator" />
            <NavItem view={AppView.SETTINGS} icon={Settings} label="Settings" />
          </nav>
          
          <div className="pt-6 border-t border-slate-800/50">
            <button 
                onClick={handleSignOut}
                className="flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-slate-500 hover:text-white transition-colors group"
            >
                <LogOut size={20} className="group-hover:text-red-400" />
                <span className="font-medium">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto h-screen bg-brand-bg p-4 md:p-12">
        <div className="max-w-6xl mx-auto">
            {children}
        </div>
      </main>
      
      {/* Overlay for mobile menu */}
      {isMobileMenuOpen && (
        <div 
            className="fixed inset-0 bg-black/80 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
        ></div>
      )}
      
      <ToastNotification />
    </div>
  );
};

export default Layout;
