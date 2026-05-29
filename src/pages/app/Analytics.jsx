import { motion } from 'framer-motion';
import { BarChart3, Award, ShieldCheck, ShieldAlert, Zap, Clock, Download, Brain } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { TrendArea, GlowBars, DonutChart, MiniBars } from '@/components/charts/Charts';
import { ANALYTICS } from '@/data/mockData';
import { useToast } from '@/store/toastStore';

export default function Analytics() {
  const toast = useToast();
  const k = ANALYTICS.kpis;

  return (
    <div>
      <PageHeader
        eyebrow="Intelligence"
        icon={BarChart3}
        title="Analytics & Reporting"
        description="Executive-level insight into issuance, verification, departments and fraud."
        actions={<Button variant="secondary" icon={Download} onClick={() => toast.success('Report exported (CSV) — demo')}>Export report</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Issued this month" value={k.thisMonth} icon={Award} tone="electric" delta={14} />
        <StatCard label="Total verifications" value={k.verifications} icon={ShieldCheck} tone="cyan" delta={22} delay={0.05} />
        <StatCard label="Avg generation time" value={k.avgGenerationTime} suffix="s" icon={Clock} tone="success" delta={-86} delay={0.1} />
        <StatCard label="Fraud blocked" value={k.fraudBlocked} icon={ShieldAlert} tone="danger" delta={-9} delay={0.15} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-2">
          <h3 className="mb-1 font-semibold text-white">Issuance vs verification</h3>
          <p className="mb-4 text-xs text-slate-500">Monthly volume across the program</p>
          <TrendArea data={ANALYTICS.issuanceTrend} height={300} />
        </GlassCard>
        <GlassCard className="p-6">
          <h3 className="mb-1 font-semibold text-white">Fraud breakdown</h3>
          <p className="mb-2 text-xs text-slate-500">By detection signal</p>
          <DonutChart data={ANALYTICS.fraudBreakdown} height={260} />
        </GlassCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-2">
          <h3 className="mb-1 font-semibold text-white">Certificates by department</h3>
          <p className="mb-4 text-xs text-slate-500">Distribution across tracks</p>
          <GlowBars data={ANALYTICS.byDepartment} height={300} />
        </GlassCard>
        <GlassCard className="p-6">
          <h3 className="mb-1 font-semibold text-white">Weekly engagement</h3>
          <p className="mb-4 text-xs text-slate-500">Platform activity index</p>
          <MiniBars data={ANALYTICS.engagement} height={240} />
        </GlassCard>
      </div>

      {/* AI insights */}
      <GlassCard glow strong className="mt-6 p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
          <Brain className="h-5 w-5 text-electric-300" /> AI-generated insights
          <Badge tone="electric" className="ml-1">Auto-updated</Badge>
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {ANALYTICS.insights.map((insight, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4"
            >
              <Zap className="mt-0.5 h-4 w-4 shrink-0 text-electric-300" />
              <p className="text-sm text-slate-300">{insight}</p>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
