import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Award, Sparkles, TrendingUp, Flame, ScanLine, Trophy, ArrowRight, Clock, ShieldCheck, UploadCloud,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import CertificateCard from '@/components/certificate/CertificateCard';
import CertificateModal from '@/components/certificate/CertificateModal';
import { MiniBars } from '@/components/charts/Charts';
import Spinner from '@/components/ui/Spinner';
import { useAuthStore } from '@/store/authStore';
import { listCertificates } from '@/services/certificateService';
import { SEED_CERTIFICATES, DEMO_USERS } from '@/data/mockData';
import {
  getWeeklyActivity, getMilestones, maybeSeedDemoActivity, EVENT_TYPES,
} from '@/services/activityService';
import { timeAgo } from '@/lib/utils';

const timeAgoMs = (ms) => timeAgo(new Date(ms).toISOString());

const MILESTONE_FORMAT = {
  [EVENT_TYPES.APPROVED]: (p) => ({ text: `Earned "${p.certificateName}"`, tone: 'success' }),
  [EVENT_TYPES.REJECTED]: (p) => ({ text: `Submission rejected: ${p.certificateName}`, tone: 'danger' }),
  [EVENT_TYPES.SUBMITTED]: (p) => ({ text: `Submitted "${p.certificateName}" for review`, tone: 'electric' }),
  [EVENT_TYPES.VERIFIED]: (p) => ({ text: `Verified by ${p.by || 'a verifier'}`, tone: 'cyan' }),
  [EVENT_TYPES.ISSUED]: (p) => ({ text: `Completed "${p.certificateName}"`, tone: 'violet' }),
};

const TONE_DOT = {
  success: 'bg-emerald-400',
  danger: 'bg-rose-400',
  electric: 'bg-electric-400',
  cyan: 'bg-cyanglow-400',
  violet: 'bg-violetglow-400',
};

export default function MaverickDashboard() {
  const user = useAuthStore((s) => s.user);
  const location = useLocation();
  const [certs, setCerts] = useState(null);
  const [active, setActive] = useState(null);
  const [weekly, setWeekly] = useState([]);
  const [milestones, setMilestones] = useState([]);

  const isDemoUser = DEMO_USERS.some((u) => u.email === user.email);

  // Seed the demo Maverick's activity log on first visit so the chart/timeline
  // aren't bare on demo. Idempotent.
  useEffect(() => {
    if (isDemoUser) maybeSeedDemoActivity(user);
    setWeekly(getWeeklyActivity(user.id));
    setMilestones(getMilestones(user.id, 5));
  }, [user, isDemoUser, location.pathname]);

  useEffect(() => {
    listCertificates().then((all) => {
      const mine = all.filter((c) => c.recipientName === user.name || c.recipientId === user.id);
      if (mine.length) return setCerts(mine);
      if (isDemoUser) {
        setCerts(SEED_CERTIFICATES.slice(0, 6).map((c) => ({ ...c, recipientName: user.name })));
      } else {
        setCerts([]);
      }
    });
  }, [user.id, user.name, isDemoUser]);

  const weeklyTotal = useMemo(() => weekly.reduce((a, b) => a + b.value, 0), [weekly]);
  // Consecutive days from today backwards with at least one event.
  const dayStreak = useMemo(() => {
    let s = 0;
    for (let i = weekly.length - 1; i >= 0; i--) {
      if (weekly[i].value > 0) s += 1;
      else break;
    }
    return s;
  }, [weekly]);
  // Real metric: sum of learning hours across all earned certs.
  const learningHours = useMemo(
    () => (certs || []).reduce((sum, c) => sum + (c.learningHours || 0), 0),
    [certs]
  );

  return (
    <div>
      <PageHeader
        eyebrow="My Overview"
        icon={Sparkles}
        title={`Welcome back, ${user.name.split(' ')[0]} 👋`}
        description="Your achievements, recognition and growth — all in one place."
        actions={
          <>
            <Link to="/app/verify">
              <Button icon={ScanLine} variant="secondary">Verify a certificate</Button>
            </Link>
            <Link to="/app/submit">
              <Button icon={UploadCloud}>Submit certificate</Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Certificates earned" value={certs?.length ?? 0} icon={Award} tone="electric" delta={isDemoUser ? 20 : undefined} delay={0} />
        <StatCard label="Leaderboard rank" value={isDemoUser ? 3 : 0} prefix={isDemoUser ? '#' : ''} icon={Trophy} tone="cyan" delta={isDemoUser ? 2 : undefined} delay={0.05} />
        <StatCard label="Learning hours" value={learningHours} suffix={learningHours > 0 ? 'h' : ''} icon={TrendingUp} tone="violet" delta={learningHours > 0 ? learningHours : undefined} delay={0.1} />
        <StatCard label="Day streak" value={dayStreak} suffix={dayStreak > 0 ? '🔥' : ''} icon={Flame} tone="warning" delta={dayStreak > 1 ? dayStreak : undefined} delay={0.15} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Certificates */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">Your latest certificates</h2>
            <Link to="/app/certificates" className="flex items-center gap-1 text-sm text-electric-300 hover:text-electric-200">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {!certs ? (
            <div className="flex h-48 items-center justify-center"><Spinner label="Loading certificates…" /></div>
          ) : certs.length === 0 ? (
            <GlassCard className="flex flex-col items-center justify-center gap-3 p-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-electric-500/15">
                <Award className="h-6 w-6 text-electric-300" />
              </div>
              <p className="font-medium text-white">No certificates yet</p>
              <p className="max-w-sm text-sm text-slate-400">
                Internal Hexaware certificates are assigned by HR/L&amp;D when you complete a track. Earned an external credential? Submit it for approval.
              </p>
              <Link to="/app/submit" className="mt-1">
                <Button icon={UploadCloud} size="sm">Submit a certificate</Button>
              </Link>
            </GlassCard>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {certs.slice(0, 4).map((c, i) => (
                <CertificateCard key={c.id} cert={c} index={i} onClick={() => setActive(c)} />
              ))}
            </div>
          )}
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <GlassCard className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Weekly activity</h3>
              <Badge tone={weeklyTotal > 0 ? 'violet' : 'neutral'}>{weeklyTotal} events</Badge>
            </div>
            {weeklyTotal > 0 ? (
              <MiniBars data={weekly} />
            ) : (
              <p className="py-4 text-sm text-slate-500">
                No activity yet this week — submit a credential or verify one to start your streak.
              </p>
            )}
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
              <Clock className="h-4 w-4 text-electric-300" /> Recognition timeline
            </h3>
            {milestones.length > 0 ? (
              <div className="relative space-y-4 pl-5">
                <div className="absolute bottom-2 left-1.5 top-2 w-px bg-white/10" />
                {milestones.map((e, i) => {
                  const fmt = MILESTONE_FORMAT[e.type]?.(e.payload || {});
                  if (!fmt) return null;
                  return (
                    <motion.div
                      key={e.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}
                      className="relative"
                    >
                      <span
                        className={`absolute -left-[18px] top-1 h-3 w-3 rounded-full ring-4 ring-ink-900 ${TONE_DOT[fmt.tone] || TONE_DOT.electric}`}
                        style={{ boxShadow: '0 0 8px currentColor' }}
                      />
                      <p className="text-sm text-slate-200">{fmt.text}</p>
                      <p className="text-xs text-slate-500">{timeAgoMs(e.at)}</p>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="py-2 text-sm text-slate-500">
                No recognition activity yet — submit a credential or wait for an approval to see your first milestone.
              </p>
            )}
          </GlassCard>
        </div>
      </div>

      {/* AI insight banner */}
      <GlassCard glow strong className="mt-6 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-electric-gradient shadow-glow">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-white">Your credentials are recruiter-ready</h3>
            <p className="text-sm text-slate-400">Share a verifiable QR with any client or hiring manager — fraud-proof and instant.</p>
          </div>
        </div>
        <Link to="/app/certificates"><Button iconRight={ArrowRight}>Manage credentials</Button></Link>
      </GlassCard>

      <CertificateModal cert={active} open={!!active} onClose={() => setActive(null)} />
    </div>
  );
}
