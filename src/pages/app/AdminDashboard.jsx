import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Award, ShieldCheck, ShieldAlert, Clock, Users, Sparkles, ArrowRight,
  ClipboardCheck, Zap, TrendingUp, Activity,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { TrendArea, DonutChart } from '@/components/charts/Charts';
import { ANALYTICS, SEED_APPROVALS, VERIFICATION_LOG } from '@/data/mockData';
import { useAuthStore } from '@/store/authStore';
import { ROLE_META } from '@/config/roles';
import { timeAgo } from '@/lib/utils';

const RESULT_TONE = { authentic: 'success', fraud: 'danger', expired: 'warning' };

export default function AdminDashboard() {
  const user = useAuthStore((s) => s.user);
  const meta = ROLE_META[user.role];
  const k = ANALYTICS.kpis;

  return (
    <div>
      <PageHeader
        eyebrow={`${meta.label} · Command Center`}
        icon={Activity}
        title={`Good to see you, ${user.name.split(' ')[0]}`}
        description="Real-time pulse of certificate issuance, verification and fraud across the Mavericks program."
        actions={
          <Link to="/app/generate">
            <Button icon={Sparkles} iconRight={ArrowRight}>Generate certificate</Button>
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total issued" value={k.totalIssued} icon={Award} tone="electric" delta={12} />
        <StatCard label="Verifications" value={k.verifications} icon={ShieldCheck} tone="cyan" delta={18} delay={0.05} />
        <StatCard label="Active Mavericks" value={k.activeMavericks} icon={Users} tone="violet" delta={6} delay={0.1} />
        <StatCard label="Fraud blocked" value={k.fraudBlocked} icon={ShieldAlert} tone="danger" delta={-9} delay={0.15} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Trend */}
        <GlassCard className="p-6 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">Issuance & verification trend</h3>
              <p className="text-xs text-slate-500">Last 7 months</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-slate-400"><span className="h-2 w-2 rounded-full bg-electric-400" /> Issued</span>
              <span className="flex items-center gap-1.5 text-slate-400"><span className="h-2 w-2 rounded-full bg-cyanglow-400" /> Verified</span>
            </div>
          </div>
          <TrendArea data={ANALYTICS.issuanceTrend} />
        </GlassCard>

        {/* Quick actions + fraud donut */}
        <div className="space-y-6">
          <GlassCard className="p-5">
            <h3 className="mb-3 font-semibold text-white">Quick actions</h3>
            <div className="space-y-2">
              <QuickAction to="/app/generate" icon={Sparkles} label="AI Generator" tone="electric" />
              <QuickAction to="/app/approvals" icon={ClipboardCheck} label={`Approvals (${SEED_APPROVALS.length})`} tone="cyan" />
              <QuickAction to="/app/analytics" icon={TrendingUp} label="Full Analytics" tone="violet" />
            </div>
          </GlassCard>
          <GlassCard className="p-5">
            <h3 className="mb-1 font-semibold text-white">Fraud signal breakdown</h3>
            <DonutChart data={ANALYTICS.fraudBreakdown} />
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              {ANALYTICS.fraudBreakdown.map((d) => (
                <span key={d.name} className="flex items-center gap-1.5 text-slate-400">
                  <span className="h-2 w-2 rounded-full" style={{ background: d.color }} /> {d.name}
                </span>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Pending approvals */}
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-white"><Clock className="h-4 w-4 text-amber-400" /> Pending approvals</h3>
            <Link to="/app/approvals" className="text-sm text-electric-300 hover:text-electric-200">View all</Link>
          </div>
          <div className="space-y-2">
            {SEED_APPROVALS.slice(0, 4).map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div>
                  <p className="text-sm font-medium text-white">{a.recipientName}</p>
                  <p className="text-xs text-slate-500">{a.course}</p>
                </div>
                <Badge tone="warning" dot>Pending</Badge>
              </motion.div>
            ))}
          </div>
        </GlassCard>

        {/* Recent verifications */}
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-semibold text-white"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Recent verifications</h3>
            <Badge tone="electric">Live</Badge>
          </div>
          <div className="space-y-2">
            {VERIFICATION_LOG.slice(0, 4).map((v, i) => (
              <motion.div key={v.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-white">{v.recipient}</p>
                  <p className="text-xs text-slate-500">by {v.verifiedBy} · {timeAgo(v.at)}</p>
                </div>
                <Badge tone={RESULT_TONE[v.result]} dot>{v.result}</Badge>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* AI insight */}
      <GlassCard glow strong className="mt-6 flex items-center gap-4 p-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-electric-gradient shadow-glow">
          <Zap className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-electric-300">AI Insight</p>
          <p className="text-sm text-slate-200">{ANALYTICS.insights[0]}</p>
        </div>
      </GlassCard>
    </div>
  );
}

function QuickAction({ to, icon: Icon, label, tone }) {
  const tones = { electric: 'text-electric-300 bg-electric-500/15', cyan: 'text-cyanglow-300 bg-cyanglow-500/15', violet: 'text-violetglow-300 bg-violetglow-500/15' };
  return (
    <Link to={to} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-3 transition-all hover:border-electric-400/40 hover:bg-electric-500/5">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tones[tone]}`}><Icon className="h-4.5 w-4.5" /></span>
      <span className="flex-1 text-sm font-medium text-white">{label}</span>
      <ArrowRight className="h-4 w-4 text-slate-500" />
    </Link>
  );
}
