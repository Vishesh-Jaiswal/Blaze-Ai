import { cn } from '@/lib/utils';

/** Glowing dual-ring loader. */
export default function Spinner({ size = 28, className = '', label }) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <div className="absolute inset-0 rounded-full border-2 border-white/10" />
        <div
          className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-electric-400 border-r-cyanglow-400"
          style={{ filter: 'drop-shadow(0 0 6px rgba(47,128,255,0.8))' }}
        />
      </div>
      {label && <p className="text-sm text-slate-400">{label}</p>}
    </div>
  );
}
