import { cn } from '@/lib/utils';

const TONES = {
  electric: 'bg-electric-500/15 text-electric-200 border-electric-400/30',
  cyan: 'bg-cyanglow-500/15 text-cyanglow-300 border-cyanglow-400/30',
  violet: 'bg-violetglow-500/15 text-violetglow-300 border-violetglow-400/30',
  success: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
  warning: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
  danger: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
  neutral: 'bg-white/5 text-slate-300 border-white/15',
};

export default function Badge({ children, tone = 'electric', className = '', dot = false }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium',
        TONES[tone],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />}
      {children}
    </span>
  );
}
