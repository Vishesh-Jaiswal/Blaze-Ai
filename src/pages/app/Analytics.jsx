import { useState } from 'react';
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
import { listCertificates } from '@/services/certificateService';
import { listSubmissions } from '@/services/submissionService';
import { listUsers } from '@/services/authService';

/** Escape a single CSV cell — wrap in quotes if it contains comma/quote/newline. */
function csvCell(v) {
  const s = v == null ? '' : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function csvRow(cells) { return cells.map(csvCell).join(','); }

async function buildReport() {
  // Pull live numbers alongside the static analytics so the export reflects
  // both the dashboard view and the real state of the platform.
  const [certs, submissions, users] = await Promise.all([
    listCertificates(),
    listSubmissions(),
    listUsers(),
  ]);

  const pending = submissions.filter((s) => s.status === 'pending').length;
  const approved = submissions.filter((s) => s.status === 'approved').length;
  const rejected = submissions.filter((s) => s.status === 'rejected').length;
  const totalHours = certs.reduce((sum, c) => sum + (c.learningHours || 0), 0);
  const mavericks = users.filter((u) => u.role === 'maverick').length;
  const admins = users.filter((u) => u.role !== 'maverick' && u.role !== 'verifier').length;

  const lines = [];
  const k = ANALYTICS.kpis;
  const now = new Date().toISOString();

  lines.push('Mavericks Certify — Analytics Report');
  lines.push(`Generated,${now}`);
  lines.push('');

  lines.push('# Key Metrics');
  lines.push(csvRow(['Metric', 'Value']));
  lines.push(csvRow(['Total certificates issued', certs.length]));
  lines.push(csvRow(['Total learning hours awarded', totalHours]));
  lines.push(csvRow(['Pending submissions', pending]));
  lines.push(csvRow(['Approved submissions', approved]));
  lines.push(csvRow(['Rejected submissions', rejected]));
  lines.push(csvRow(['Registered Mavericks', mavericks]));
  lines.push(csvRow(['Admin / L&D / HR users', admins]));
  lines.push(csvRow(['Issued this month (showcase)', k.thisMonth]));
  lines.push(csvRow(['Total verifications (showcase)', k.verifications]));
  lines.push(csvRow(['Avg generation time (s)', k.avgGenerationTime]));
  lines.push(csvRow(['Fraud blocked', k.fraudBlocked]));
  lines.push('');

  lines.push('# Monthly Issuance & Verification');
  lines.push(csvRow(['Month', 'Issued', 'Verified']));
  ANALYTICS.issuanceTrend.forEach((r) => lines.push(csvRow([r.month, r.issued, r.verified])));
  lines.push('');

  lines.push('# Certificates by Department');
  lines.push(csvRow(['Department', 'Issued']));
  ANALYTICS.byDepartment.forEach((r) => lines.push(csvRow([r.fullName, r.issued])));
  lines.push('');

  lines.push('# Fraud Breakdown by Signal');
  lines.push(csvRow(['Signal', 'Count']));
  ANALYTICS.fraudBreakdown.forEach((r) => lines.push(csvRow([r.name, r.value])));
  lines.push('');

  lines.push('# Weekly Engagement Index');
  lines.push(csvRow(['Day', 'Index']));
  ANALYTICS.engagement.forEach((r) => lines.push(csvRow([r.day, r.value])));
  lines.push('');

  lines.push('# AI-Generated Insights');
  ANALYTICS.insights.forEach((insight, i) => lines.push(csvRow([`Insight ${i + 1}`, insight])));
  lines.push('');

  lines.push('# Issued Certificate Registry');
  lines.push(csvRow(['Certificate ID', 'Recipient', 'Course', 'Department', 'Score', 'Learning Hours', 'Status', 'Issued At']));
  certs.forEach((c) => lines.push(csvRow([
    c.id, c.recipientName, c.course, c.department, c.score, c.learningHours || 0, c.status, c.issuedAt,
  ])));

  return lines.join('\n');
}

function downloadCsv(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function Analytics() {
  const toast = useToast();
  const [exporting, setExporting] = useState(false);
  const k = ANALYTICS.kpis;

  const handleExport = async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const csv = await buildReport();
      const date = new Date().toISOString().slice(0, 10);
      downloadCsv(csv, `mavericks-certify-report-${date}.csv`);
      toast.success('Report downloaded as CSV');
    } catch (_) {
      toast.error('Could not generate report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="Intelligence"
        icon={BarChart3}
        title="Analytics & Reporting"
        description="Executive-level insight into issuance, verification, departments and fraud."
        actions={<Button variant="secondary" icon={Download} loading={exporting} onClick={handleExport}>Export report</Button>}
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
