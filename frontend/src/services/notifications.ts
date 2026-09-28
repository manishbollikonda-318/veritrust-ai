// Global notification system for non-React contexts (like api.ts)
// Uses a simple event-based approach to trigger toasts from anywhere

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastEvent extends CustomEvent {
  detail: {
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
  };
}

let toastListeners: ((event: ToastEvent) => void)[] = [];

export function notifyToast(type: ToastType, title: string, message?: string, duration = 5000) {
  const event = new CustomEvent('veritrust:toast', {
    detail: { type, title, message, duration }
  }) as ToastEvent;
  window.dispatchEvent(event);
}

export function onToast(listener: (event: ToastEvent) => void) {
  toastListeners.push(listener);
  return () => {
    toastListeners = toastListeners.filter(l => l !== listener);
  };
}

// Auto-setup listener when this module loads in browser
if (typeof window !== 'undefined') {
  window.addEventListener('veritrust:toast', (event) => {
    toastListeners.forEach(listener => listener(event as ToastEvent));
  });
}