import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Custom glassy select. `options` = [{ value, label }] or string[].
 */
export default function Select({ label, value, onChange, options = [], placeholder = 'Select…', className = '' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const normalized = options.map((o) => (typeof o === 'string' ? { value: o, label: o } : o));
  const selected = normalized.find((o) => o.value === value);

  useEffect(() => {
    const onClick = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className={cn('w-full', className)} ref={ref}>
      {label && <label className="mb-1.5 block text-sm font-medium text-slate-300">{label}</label>}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={cn(
            'flex h-12 w-full items-center justify-between rounded-xl border bg-white/[0.03] px-4 text-sm transition-all',
            'hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-electric-400/40',
            open ? 'border-electric-400/50 ring-2 ring-electric-400/30' : 'border-white/10',
            selected ? 'text-white' : 'text-slate-500'
          )}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
        </button>
        <AnimatePresence>
          {open && (
            <motion.ul
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="absolute z-30 mt-2 max-h-60 w-full overflow-auto rounded-xl border border-white/10 bg-ink-900 p-1.5 shadow-2xl shadow-black/60"
            >
              {normalized.map((o) => (
                <li key={o.value}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange?.(o.value);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                      o.value === value ? 'bg-electric-500/20 text-white' : 'text-slate-300 hover:bg-white/5'
                    )}
                  >
                    {o.label}
                    {o.value === value && <Check className="h-4 w-4 text-electric-300" />}
                  </button>
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
