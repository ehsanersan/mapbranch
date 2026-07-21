import React from 'react';
import { useStore } from '@/store/useStore';

const config = {
  success: {
    icon: '✓',
    bg: 'from-green-500/20 to-green-600/10',
    border: 'border-green-500/30',
    text: 'text-green-400',
  },
  error: {
    icon: '✕',
    bg: 'from-red-500/20 to-red-600/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
  },
  info: {
    icon: 'ℹ',
    bg: 'from-primary/20 to-primary-dark/10',
    border: 'border-primary/30',
    text: 'text-primary-light',
  },
  warning: {
    icon: '⚠',
    bg: 'from-amber-500/20 to-amber-600/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
  },
};

export default function ToastContainer() {
  const toasts = useStore((s) => s.toasts);
  const removeToast = useStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[9999] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast, index) => {
        const c = config[toast.type];
        return (
          <div
            key={toast.id}
            style={{ animationDelay: `${index * 50}ms` }}
            className={`
              animate-slide-up glass rounded-2xl px-4 py-3 flex items-center gap-3 
              cursor-pointer hover:scale-[1.02] transition-transform
              bg-gradient-to-r ${c.bg} border ${c.border}
              shadow-2xl
            `}
            onClick={() => removeToast(toast.id)}
          >
            <div className={`w-8 h-8 rounded-xl bg-black/20 flex items-center justify-center text-sm font-bold ${c.text}`}>
              {c.icon}
            </div>
            <span className="text-sm font-medium text-white">{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
}
