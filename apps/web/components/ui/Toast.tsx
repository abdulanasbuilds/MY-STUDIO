'use client';

// MY STUDIO — Toast.tsx
// PURPOSE: Simple toast notification system with success/error/info variants

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

import { cn } from '@/lib/cn';

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const variantConfig: Record<ToastVariant, { icon: typeof CheckCircle; className: string }> = {
  success: { icon: CheckCircle, className: 'border-success/30 bg-success/10 text-success' },
  error: { icon: AlertCircle, className: 'border-error/30 bg-error/10 text-error' },
  info: { icon: Info, className: 'border-primary/30 bg-primary/10 text-primary' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, variant: ToastVariant = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((prev) => [...prev, { id, message, variant }]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}

      {/* Toast container */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => {
            const config = variantConfig[t.variant];
            const Icon = config.icon;

            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className={cn(
                  'flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg',
                  config.className,
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <p className="text-sm">{t.message}</p>
                <button
                  onClick={() => removeToast(t.id)}
                  className="ml-2 shrink-0 opacity-60 hover:opacity-100"
                  aria-label="Dismiss toast"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
