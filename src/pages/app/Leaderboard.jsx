import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Crown, Medal, Award, TrendingUp, Minus, ArrowDown, UserCircle2, Clock } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { LEADERBOARD } from '@/data/mockData';
import { initials } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { listUsers } from '@/services/authService';
import { listCertificates } from '@/services/certificateService';
import { listEvents, EVENT_TYPES } from '@/services/activityService';
import { ROLES } from '@/config/roles';

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

/**
 * Points formula:
 *  - 100 points per issued certificate
 *  - 5 points per learning hour earned
 *  - 5 points per active day
 */
function computePointsFor(user, allCerts) {
  const certs = allCerts.filter((c) => c.recipientId === user.id || c.recipientName === user.name);
  const learningHours = certs.reduce((sum, c) => sum + (c.learningHours || 0), 0);
  const events = listEvents(user.id);
  const activeDays = new Set(events.map((e) => Math.floor(e.at / 86400000))).size;
  return {
    certificates: certs.length,
    learningHours,
    points: certs.length * 100 + learningHours * 5 + activeDays * 5,
    streak: activeDays,
    trend: certs.length >= 5 ? 'up' : certs.length >= 2 ? 'flat' : 'down',
  };
}

export default function Leaderboard() {
  const me = useAuthStore((s) => s.user);
  const [rows, setRows] = useState(null);

  useEffect(() => {
    Promise.all([listUsers({ role: ROLES.MAVERICK }), listCertificates()]).then(([users, certs]) => {
      // Compute real stats for each registered Maverick.
      const realRows = users.map((u) => {
        const stats = computePointsFor(u, certs);
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          department: u.department,
          real: true,
          ...stats,
        };
      });

      // Merge with seeded leaderboard so the board never looks empty.
      // If a seed name matches a real user, keep the real row.
      const realNames = new Set(realRows.map((r) => r.name));
      const seedRows = LEADERBOARD
        .filter((s) => !realNames.has(s.name))
        .map((s) => ({
          id: `seed-${s.name}`,
          name: s.name,
          department: s.department,
          certificates: s.certificates,
          learningHours: s.learningHours || 0,
          points: s.points,
          streak: s.streak,
          trend: s.trend,
          real: false,
        }));

      const merged = [...realRows, ...seedRows]
        .sort((a, b) => b.points - a.points)
        .map((row, i) => ({ ...row, rank: i + 1 }));
      setRows(merged);
    });
  }, [me.id]);

  const podium = useMemo(() => {
    if (!rows || rows.length < 3) return null;
    return [rows[1], rows[0], rows[2]]; // visual order: 2nd, 1st, 3rd
  }, [rows]);

  // The current user's row (if they're a Maverick and exist in the merged list)
  const myRow = useMemo(() => {
    if (!rows) return null;
    return rows.find((r) => r.id === me.id || r.name === me.name) || null;
  }, [rows, me.id, me.name]);
  const isUnranked = myRow ? (myRow.certificates || 0) === 0 : true;

  return (
    <div>
      <PageHeader
        eyebrow="Recognition"
        icon={Trophy}
        title="Mavericks Leaderboard"
        description="Live ranking — points = 100 per certificate + 5 per learning hour + 5 per active day."
      />

      {!rows ? (
        <div className="flex h-64 items-center justify-center"><Spinner label="Computing ranks…" /></div>
      ) : (
        <>
          {/* Your rank — only for Mavericks */}
          {me.role === ROLES.MAVERICK && (
            <GlassCard glow strong className="mb-6 flex flex-col items-center gap-4 p-5 sm:flex-row sm:items-center">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-electric-gradient text-base font-bold text-white shadow-glow-sm">
                {initials(me.name)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-electric-300">Your rank</p>
                {isUnranked ? (
                  <>
                    <p className="mt-0.5 font-display text-xl font-bold text-white">No rank yet</p>
                    <p className="text-sm text-slate-400">Earn your first certificate to enter the leaderboard.</p>
                  </>
                ) : (
                  <>
                    <p className="mt-0.5 font-display text-3xl font-bold text-gradient">#{myRow.rank}</p>
                    <p className="text-sm text-slate-400">
                      {myRow.points.toLocaleString()} pts · {myRow.certificates} cert{myRow.certificates === 1 ? '' : 's'}
                      {myRow.learningHours != null ? ` · ${myRow.learningHours}h` : ''}
                    </p>
                  </>
                )}
              </div>
              {isUnranked ? (
                <Badge tone="neutral" className="shrink-0">
                  <UserCircle2 className="h-3 w-3" /> Unranked
                </Badge>
              ) : (
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge tone="electric">
                    <Trophy className="h-3 w-3" /> Top {Math.max(1, Math.round((myRow.rank / rows.length) * 100))}%
                  </Badge>
                  {myRow.learningHours > 0 && (
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <Clock className="h-3 w-3" /> {myRow.learningHours} learning hours
                    </span>
                  )}
                </div>
              )}
            </GlassCard>
          )}

          {/* Podium */}
          {podium && (
            <div className="mb-8 grid grid-cols-3 items-end gap-3 sm:gap-6">
              {podium.map((m, i) => {
                const style = PODIUM_STYLES[m.rank - 1] || PODIUM_STYLES[2];
                const Icon = style.icon;
                return (
                  <motion.div
                    key={m.id}
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
          )}

          {/* Full table */}
          <GlassCard className="overflow-hidden">
            <div className="grid grid-cols-12 gap-2 border-b border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <span className="col-span-1">Rank</span>
              <span className="col-span-4">Maverick</span>
              <span className="col-span-3 hidden sm:block">Department</span>
              <span className="col-span-2 text-right">Points</span>
              <span className="col-span-1 hidden text-right md:block">Hours</span>
              <span className="col-span-1 text-right">Certs</span>
            </div>
            {rows.map((m, i) => {
              const Trend = TREND[m.trend].icon;
              const isMe = m.id === me.id || m.name === me.name;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.4) }}
                  className={`grid grid-cols-12 items-center gap-2 border-b border-white/5 px-5 py-3 text-sm transition-colors hover:bg-white/[0.03] ${isMe ? 'bg-electric-500/10' : ''}`}
                >
                  <span className="col-span-1 flex items-center gap-1 font-semibold text-slate-400">
                    {m.rank}
                    <Trend className={`h-3.5 w-3.5 ${TREND[m.trend].cls}`} />
                  </span>
                  <span className="col-span-4 flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-xs font-bold text-white">
                      {initials(m.name)}
                    </span>
                    <span className="flex items-center gap-2 font-medium text-white">
                      {m.name}
                      {isMe && <Badge tone="electric">You</Badge>}
                      {m.real && !isMe && <Badge tone="success">Active</Badge>}
                    </span>
                  </span>
                  <span className="col-span-3 hidden text-slate-400 sm:block">{m.department}</span>
                  <span className="col-span-2 text-right font-semibold text-white">{m.points.toLocaleString()}</span>
                  <span className="col-span-1 hidden text-right text-slate-400 md:block">{m.learningHours || 0}h</span>
                  <span className="col-span-1 text-right text-slate-400">{m.certificates}</span>
                </motion.div>
              );
            })}
          </GlassCard>
        </>
      )}
    </div>
  );
}
