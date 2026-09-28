import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { notifyToast, onToast } from '../services/notifications';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: Toast['type'], title: string, message?: string, duration?: number) => void;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: Toast['type'], title: string, message?: string, duration = 5000) => {
    const id = Math.random().toString(36).substring(7);
    const toast: Toast = { id, type, title, message, duration };
    setToasts(prev => [...prev, toast]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Listen for global notifications from non-React contexts (like api.ts)
  useEffect(() => {
    const unsubscribe = onToast((event: CustomEvent) => {
      const { type, title, message, duration } = event.detail;
      showToast(type, title, message, duration);
    });
    return unsubscribe;
  }, [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onHide={hideToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({ toasts, onHide }: { toasts: Toast[]; onHide: (id: string) => void }) {
  if (toasts.length === 0) return null;

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success': return (
        <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      case 'error': return (
        <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
      case 'warning': return (
        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
      default: return (
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
  };

  const getBgColor = (type: Toast['type']) => {
    switch (type) {
      case 'success': return 'bg-emerald-50 border-emerald-200';
      case 'error': return 'bg-rose-50 border-rose-200';
      case 'warning': return 'bg-amber-50 border-amber-200';
      default: return 'bg-blue-50 border-blue-200';
    }
  };

  const getTitleColor = (type: Toast['type']) => {
    switch (type) {
      case 'success': return 'text-emerald-900';
      case 'error': return 'text-rose-900';
      case 'warning': return 'text-amber-900';
      default: return 'text-blue-900';
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-xl animate-slide-in ${getBgColor(toast.type)} min-w-[280px] max-w-md`}
          role="alert"
        >
          <div className="flex-shrink-0 mt-0.5">{getIcon(toast.type)}</div>
          <div className="flex-1 min-w-0">
            <p className={`font-black text-sm ${getTitleColor(toast.type)}`}>{toast.title}</p>
            {toast.message && (
              <p className={`text-xs mt-1 ${getTitleColor(toast.type).replace('900', '700')}`}>{toast.message}</p>
            )}
          </div>
          <button
            onClick={() => onHide(toast.id)}
            className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-700 rounded-lg transition-colors"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}