import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import GlassCard from './GlassCard';
import useCountUp from '@/hooks/useCountUp';
import { cn } from '@/lib/utils';

const TONES = {
  electric: { icon: 'text-electric-300 bg-electric-500/15', glow: 'shadow-glow' },
  cyan: { icon: 'text-cyanglow-300 bg-cyanglow-500/15', glow: 'shadow-glow-cyan' },
  violet: { icon: 'text-violetglow-300 bg-violetglow-500/15', glow: 'shadow-glow-violet' },
  success: { icon: 'text-emerald-300 bg-emerald-500/15', glow: '' },
  warning: { icon: 'text-amber-300 bg-amber-500/15', glow: '' },
  danger: { icon: 'text-rose-300 bg-rose-500/15', glow: '' },
};

export default function StatCard({ label, value, suffix = '', prefix = '', icon: Icon, tone = 'electric', delta, decimals = 0, delay = 0 }) {
  const animated = useCountUp(value, { decimals, duration: 1600 });
  const t = TONES[tone] || TONES.electric;
  const up = delta != null && delta >= 0;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <GlassCard hover className="relative overflow-hidden p-5">
        <div className="flex items-start justify-between">
          <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', t.icon)}>
            {Icon && <Icon className="h-5.5 w-5.5" />}
          </div>
          {delta != null && (
            <span className={cn('flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium',
              up ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300')}>
              {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(delta)}%
            </span>
          )}
        </div>
        <p className="mt-4 font-display text-3xl font-bold text-white">
          {prefix}
          {decimals ? animated.toFixed(decimals) : Math.round(animated).toLocaleString()}
          {suffix}
        </p>
        <p className="mt-1 text-sm text-slate-400">{label}</p>
        <div className="pointer-events-none absolute -bottom-8 -right-8 h-24 w-24 rounded-full bg-electric-500/10 blur-2xl" />
      </GlassCard>
    </motion.div>
  );
}
