import React, { useState, useEffect } from 'react';
import { X, AlertCircle } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const [toast, setToast] = useState<{ message: string, type?: string, id: number } | null>(null);

  useEffect(() => {
    const handleToast = (e: CustomEvent<{ message: string, type?: string }>) => {
      const id = Date.now();
      setToast({ ...e.detail, id });
      setTimeout(() => {
        setToast(prev => prev?.id === id ? null : prev);
      }, 5000);
    };

    window.addEventListener('app-toast' as any, handleToast);
    return () => window.removeEventListener('app-toast' as any, handleToast);
  }, []);

  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div className={`fixed bottom-6 right-6 z-[9999] p-4 rounded-xl shadow-2xl flex items-start space-x-3 max-w-sm transition-all duration-300 ${
      isError ? 'bg-red-950 border border-red-900/50 text-red-200' : 'bg-orange-950 border border-orange-900/50 text-orange-200'
    }`}>
      <AlertCircle className={`flex-shrink-0 mt-0.5 ${isError ? 'text-red-500' : 'text-orange-500'}`} size={20} />
      <div className="flex-1 font-medium text-sm">
        {toast.message}
      </div>
      <button 
        onClick={() => setToast(null)}
        className={`flex-shrink-0 p-1 rounded-md transition-colors ${
          isError ? 'hover:bg-red-900/50 text-red-400 hover:text-red-200' : 'hover:bg-orange-900/50 text-orange-400 hover:text-orange-200'
        }`}
      >
        <X size={16} />
      </button>
    </div>
  );
};
