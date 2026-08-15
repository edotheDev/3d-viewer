import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Camera, Download } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'screenshot';
  title: string;
  description?: string;
  thumbnail?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div
      id="toast-notification-region"
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full px-4"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto flex items-center gap-3 p-3.5 rounded-2xl bg-white border border-[#E5E5E5] shadow-[0_20px_40px_rgba(0,0,0,0.08)] text-[#111111]"
            onClick={() => onDismiss(toast.id)}
          >
            {toast.thumbnail ? (
              <img
                src={toast.thumbnail}
                alt="Capture Preview"
                className="w-10 h-10 rounded-lg object-cover border border-[#E5E5E5] bg-[#F7F7F7]"
              />
            ) : (
              <div className="p-2 rounded-xl bg-neutral-100 text-[#111111]">
                {toast.type === 'screenshot' && <Camera className="w-4 h-4" />}
                {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600" />}
                {toast.type === 'info' && <Download className="w-4 h-4 text-[#111111]" />}
              </div>
            )}

            <div className="flex flex-col flex-1 min-w-0">
              <span className="text-xs font-acid uppercase tracking-wider text-[#111111] font-bold truncate">
                {toast.title}
              </span>
              {toast.description && (
                <span className="text-[11px] font-inter text-[#888888] truncate">
                  {toast.description}
                </span>
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
