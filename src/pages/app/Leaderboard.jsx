import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, Award, TrendingUp, Minus, ArrowDown } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import { LEADERBOARD } from '@/data/mockData';
import { initials } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';

const PODIUM_STYLES = [
  { icon: Crown, color: '#fbbf24', ring: 'ring-amber-400/50', glow: 'shadow-[0_0_40px_rgba(251,191,36,0.4)]', h: 'h-40' },
  { icon: Medal, color: '#cbd5e1', ring: 'ring-slate-300/40', glow: 'shadow-[0_0_30px_rgba(203,213,225,0.3)]', h: 'h-32' },
  { icon: Award, color: '#f59e0b', ring: 'ring-orange-400/40', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.3)]', h: 'h-28' },
];

const TREND = {
  up: { icon: TrendingUp, cls: 'text-emerald-400' },
  flat: { icon: Minus, cls: 'text-slate-500' },
  down: { icon: ArrowDown, cls: 'text-rose-400' },
};

export default function Leaderboard() {
  const user = useAuthStore((s) => s.user);
  const [first, second, third] = LEADERBOARD;
  const podium = [second, first, third]; // visual order

  return (
    <div>
      <PageHeader
        eyebrow="Recognition"
        icon={Trophy}
        title="Mavericks Leaderboard"
        description="Celebrating the top performers across the 2026 cohort."
      />

      {/* Podium */}
      <div className="mb-8 grid grid-cols-3 items-end gap-3 sm:gap-6">
        {podium.map((m, i) => {
          const realRank = m.rank - 1;
          const style = PODIUM_STYLES[realRank] || PODIUM_STYLES[2];
          const Icon = style.icon;
          return (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.12, type: 'spring', stiffness: 200, damping: 20 }}
              className="flex flex-col items-center"
            >
              <Icon className="mb-2 h-7 w-7" style={{ color: style.color }} />
              <div className={`flex h-16 w-16 items-center justify-center rounded-full bg-electric-gradient text-lg font-bold text-white ring-4 ${style.ring} ${style.glow}`}>
                {initials(m.name)}
              </div>
              <p className="mt-2 text-center text-sm font-semibold text-white">{m.name}</p>
              <p className="text-xs text-slate-500">{m.points.toLocaleString()} pts</p>
              <div className={`mt-3 w-full rounded-t-xl border border-white/10 bg-white/[0.04] ${style.h} flex items-start justify-center pt-3`}>
                <span className="font-display text-3xl font-bold text-gradient">#{m.rank}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Full table */}
      <GlassCard className="overflow-hidden">
        <div className="grid grid-cols-12 gap-2 border-b border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
          <span className="col-span-1">Rank</span>
          <span className="col-span-5">Maverick</span>
          <span className="col-span-3 hidden sm:block">Department</span>
          <span className="col-span-2 text-right sm:col-span-2">Points</span>
          <span className="col-span-1 text-right">Certs</span>
        </div>
        {LEADERBOARD.map((m, i) => {
          const Trend = TREND[m.trend].icon;
          const isMe = m.name === user.name;
          return (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
              className={`grid grid-cols-12 items-center gap-2 border-b border-white/5 px-5 py-3 text-sm transition-colors hover:bg-white/[0.03] ${isMe ? 'bg-electric-500/10' : ''}`}
            >
              <span className="col-span-1 flex items-center gap-1 font-semibold text-slate-400">
                {m.rank}
                <Trend className={`h-3.5 w-3.5 ${TREND[m.trend].cls}`} />
              </span>
              <span className="col-span-5 flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-xs font-bold text-white">
                  {initials(m.name)}
                </span>
                <span className="font-medium text-white">{m.name}{isMe && <Badge tone="electric" className="ml-2">You</Badge>}</span>
              </span>
              <span className="col-span-3 hidden text-slate-400 sm:block">{m.department}</span>
              <span className="col-span-2 text-right font-semibold text-white">{m.points.toLocaleString()}</span>
              <span className="col-span-1 text-right text-slate-400">{m.certificates}</span>
            </motion.div>
          );
        })}
      </GlassCard>
    </div>
  );
}
