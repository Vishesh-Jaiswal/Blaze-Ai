import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, Scan, Cpu, AlertTriangle, CheckCircle2, XCircle, Activity,
  Layers, Type, FileSearch, QrCode, Radar,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { Gauge, DonutChart } from '@/components/charts/Charts';
import { analyzeFraud } from '@/services/fraudService';
import { ANALYTICS } from '@/data/mockData';
import { cn } from '@/lib/utils';

const SIGNAL_ICON = { layout: Layers, font: Type, metadata: FileSearch, qr: QrCode, anomaly: Radar };
const RISK_UI = {
  low: { color: '#10b981', tone: 'success', label: 'Low Risk' },
  medium: { color: '#f59e0b', tone: 'warning', label: 'Medium Risk' },
  high: { color: '#f43f5e', tone: 'danger', label: 'High Risk' },
};
const STATUS_UI = {
  pass: { icon: CheckCircle2, color: 'text-emerald-400' },
  warn: { icon: AlertTriangle, color: 'text-amber-400' },
  fail: { icon: XCircle, color: 'text-rose-400' },
};

export default function FraudDetection() {
  const [target, setTarget] = useState('');
  const [scanning, setScanning] = useState(false);
  const [report, setReport] = useState(null);

  const run = async (t) => {
    const val = (t ?? target).trim() || 'HEX-MAV-2026-SAMPLE';
    setScanning(true);
    setReport(null);
    const res = await analyzeFraud(val);
    setReport(res);
    setScanning(false);
  };

  const risk = report ? RISK_UI[report.riskLevel] : null;

  return (
    <div>
      <PageHeader
        eyebrow="Security · AI"
        icon={ShieldAlert}
        title="AI Fraud Detection"
        description="Multi-signal forensic analysis — layout, fonts, metadata, QR and ML anomaly detection."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Documents scanned" value={1842} icon={Scan} tone="electric" delta={11} />
        <StatCard label="Threats blocked" value={37} icon={ShieldAlert} tone="danger" delta={-9} delay={0.05} />
        <StatCard label="Detection accuracy" value={98.6} suffix="%" decimals={1} icon={Cpu} tone="success" delta={2} delay={0.1} />
        <StatCard label="Avg scan time" value={1.6} suffix="s" decimals={1} icon={Activity} tone="cyan" delta={-12} delay={0.15} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Scanner */}
        <div className="space-y-5">
          <GlassCard glow className="p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-white"><Radar className="h-4 w-4 text-electric-300" /> Run forensic scan</h3>
            <input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && run()}
              placeholder="Certificate ID or document reference…"
              className="mb-3 h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm text-white placeholder:text-slate-500 focus:border-electric-400/50 focus:outline-none focus:ring-2 focus:ring-electric-400/30"
            />
            <Button className="w-full" icon={Scan} loading={scanning} onClick={() => run()}>Analyze for fraud</Button>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="text-slate-500">Quick test:</span>
              <button onClick={() => { setTarget('HEX-MAV-2026-1A2B'); run('HEX-MAV-2026-1A2B'); }} className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-emerald-300 hover:bg-emerald-500/20">clean doc</button>
              <button onClick={() => { setTarget('forged-copy-cert'); run('forged-copy-cert'); }} className="rounded-md bg-rose-500/10 px-2 py-0.5 text-rose-300 hover:bg-rose-500/20">forged doc</button>
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="mb-1 font-semibold text-white">Fraud signal distribution</h3>
            <p className="mb-2 text-xs text-slate-500">Across all flagged documents</p>
            <DonutChart data={ANALYTICS.fraudBreakdown} height={220} />
          </GlassCard>
        </div>

        {/* Report */}
        <div>
          <AnimatePresence mode="wait">
            {scanning ? (
              <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <GlassCard className="flex min-h-[460px] flex-col items-center justify-center gap-5 p-8">
                  <div className="relative h-40 w-40">
                    <motion.div className="absolute inset-0 rounded-full border-2 border-electric-400/30" animate={{ scale: [1, 1.4], opacity: [0.6, 0] }} transition={{ duration: 1.8, repeat: Infinity }} />
                    <motion.div className="absolute inset-0 rounded-full border-2 border-electric-400/30" animate={{ scale: [1, 1.4], opacity: [0.6, 0] }} transition={{ duration: 1.8, repeat: Infinity, delay: 0.6 }} />
                    <div className="absolute inset-6 flex items-center justify-center rounded-full bg-electric-500/10"><Radar className="h-12 w-12 animate-spin-slow text-electric-300" /></div>
                  </div>
                  <p className="text-slate-300">Running AI forensic detectors…</p>
                </GlassCard>
              </motion.div>
            ) : report ? (
              <motion.div key="report" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
                <GlassCard glow strong className="overflow-hidden">
                  <div className="relative p-6" style={{ background: `linear-gradient(135deg, ${risk.color}22, transparent)` }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-400">Risk assessment</p>
                        <h3 className="font-display text-2xl font-bold" style={{ color: risk.color }}>{risk.label}</h3>
                        <p className="mt-1 font-mono text-xs text-slate-500">{report.target}</p>
                      </div>
                      <Badge tone={risk.tone} dot>{report.fraudProbability}% fraud prob.</Badge>
                    </div>
                    <p className="mt-3 text-sm text-slate-300">{report.verdict}</p>
                  </div>

                  <div className="grid gap-6 p-6 sm:grid-cols-[auto_1fr] sm:items-center">
                    <Gauge value={report.confidence} color={risk.color} label="authenticity" height={160} />
                    <div className="space-y-2">
                      {report.signals.map((s, i) => {
                        const SignalIcon = SIGNAL_ICON[s.key] || Layers;
                        const st = STATUS_UI[s.status];
                        const StatusIcon = st.icon;
                        return (
                          <motion.div key={s.key} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                            className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                            <div className="flex items-center gap-2.5">
                              <SignalIcon className="h-4 w-4 text-slate-400" />
                              <span className="flex-1 text-sm font-medium text-white">{s.label}</span>
                              <StatusIcon className={cn('h-4 w-4', st.color)} />
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/5">
                                <motion.div className="h-full rounded-full" style={{ background: s.risk > 60 ? '#f43f5e' : s.risk > 35 ? '#f59e0b' : '#10b981' }}
                                  initial={{ width: 0 }} animate={{ width: `${s.risk}%` }} transition={{ delay: i * 0.08 + 0.2, duration: 0.6 }} />
                              </div>
                              <span className="w-9 text-right text-xs text-slate-400">{s.risk}%</span>
                            </div>
                            <p className="mt-1 text-[11px] text-slate-500">{s.desc}</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ) : (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <GlassCard className="flex min-h-[460px] flex-col items-center justify-center gap-3 p-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-electric-500/10"><ShieldAlert className="h-8 w-8 text-electric-300" /></div>
                  <p className="font-display text-lg font-semibold text-white">No scan yet</p>
                  <p className="max-w-xs text-sm text-slate-400">Run a forensic scan to see a full multi-signal risk breakdown.</p>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
