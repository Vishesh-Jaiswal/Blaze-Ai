import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';

const CONFIG = {
  success: { icon: CheckCircle2, color: 'text-emerald-400', bar: 'from-emerald-400 to-teal-400' },
  error: { icon: XCircle, color: 'text-rose-400', bar: 'from-rose-400 to-red-500' },
  warning: { icon: AlertTriangle, color: 'text-amber-400', bar: 'from-amber-400 to-orange-400' },
  info: { icon: Info, color: 'text-electric-300', bar: 'from-electric-400 to-cyanglow-400' },
};

export default function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-full max-w-sm flex-col gap-3">
      <AnimatePresence>
        {toasts.map((t) => {
          const cfg = CONFIG[t.type] || CONFIG.info;
          const Icon = cfg.icon;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, x: 80, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 350, damping: 26 }}
              className="glass-strong pointer-events-auto relative overflow-hidden rounded-xl p-4 pr-10"
            >
              <div className="flex items-start gap-3">
                <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${cfg.color}`} />
                <div className="min-w-0">
                  {t.title && <p className="text-sm font-semibold text-white">{t.title}</p>}
                  <p className="text-sm text-slate-300">{t.message}</p>
                </div>
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="absolute right-2.5 top-2.5 text-slate-500 transition-colors hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="absolute bottom-0 left-0 h-0.5 w-full overflow-hidden">
                <motion.div
                  className={`h-full bg-gradient-to-r ${cfg.bar}`}
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: (t.duration || 4000) / 1000, ease: 'linear' }}
                />
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
