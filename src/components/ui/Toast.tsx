'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { X, CheckCircle2, AlertTriangle, Info, ShieldAlert, Undo2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onUndo?: () => void;
}

interface ToastCtx {
  toast: (data: Omit<ToastData, 'id'>) => void;
}

const ToastContext = createContext<ToastCtx>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const toast = useCallback((data: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { ...data, id }]);
    // If it has undo, keep it longer
    const duration = data.onUndo ? 6000 : 4000;
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <ToastItem key={t.id} {...t} onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

const icons = {
  success: CheckCircle2,
  error: ShieldAlert,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'bg-emerald-600 border-emerald-500',
  error: 'bg-red-600 border-red-500',
  warning: 'bg-amber-500 border-amber-400',
  info: 'bg-blue-600 border-blue-500',
};

function ToastItem({ type, message, onUndo, onClose }: ToastData & { onClose: () => void }) {
  const Icon = icons[type];
  
  const handleUndo = () => {
    if (onUndo) onUndo();
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      layout
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-modal text-white text-xs font-bold border-none ${styles[type]}`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <p className="flex-1 leading-relaxed">{message}</p>
      
      {onUndo && (
        <button
          onClick={handleUndo}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all cursor-pointer shadow-sm"
        >
          <Undo2 className="w-3.5 h-3.5" />
          Deshacer
        </button>
      )}

      <button onClick={onClose} className="shrink-0 p-1.5 rounded-lg hover:bg-white/20 transition-all cursor-pointer">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
