import React, { useEffect, useState } from 'react';
import { ShieldAlert, X, CheckCircle2, Info } from 'lucide-react';

export default function GlobalToast() {
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handleToast = (e) => {
      const { message, type = 'info' } = e.detail;
      setToast({ message, type });
    };

    window.addEventListener('app-toast', handleToast);
    return () => window.removeEventListener('app-toast', handleToast);
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  if (!toast) return null;

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';
  const borderClass = isError ? 'border-red-500' : isSuccess ? 'border-[#10B981]' : 'border-blue-500';
  const iconBg = isError ? 'bg-[#EF4444]/10 text-[#EF4444]' : isSuccess ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#3B82F6]/10 text-[#3B82F6]';
  const Icon = isError ? ShieldAlert : isSuccess ? CheckCircle2 : Info;

  return (
    <div className="fixed bottom-6 right-6 z-[9999] transition-all duration-300 transform scale-100">
      <div className={`flex items-center gap-3 max-w-md p-4 bg-white border-l-4 ${borderClass} rounded-r-xl rounded-l-md shadow-2xl border border-gray-100 hover:shadow-3xl transition-shadow duration-300`}>
        <div className={`flex items-center justify-center shrink-0 w-8 h-8 rounded-lg ${iconBg}`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 pr-2 text-sm font-semibold text-[#111827]">
          {toast.message}
        </div>
        <button
          onClick={() => setToast(null)}
          className="shrink-0 p-1 text-[#9CA3AF] hover:text-[#4B5563] hover:bg-[#F3F4F6] rounded-lg transition-colors"
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
