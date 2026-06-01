import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Award, ClipboardCheck, ShieldAlert, Zap, TrendingUp, Download, Brain } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import { TrendArea, GlowBars, DonutChart, MiniBars } from '@/components/charts/Charts';
import { useToast } from '@/store/toastStore';
import { listCertificates } from '@/services/certificateService';
import { listSubmissions } from '@/services/submissionService';
import { listUsers } from '@/services/authService';
import { listScans, getFraudStats } from '@/services/fraudService';
import { generateInsights } from '@/services/aiService';
import { hasApiKey } from '@/services/anthropicClient';

const SHORT_MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function csvCell(v) {
  const s = v == null ? '' : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
function csvRow(cells) { return cells.map(csvCell).join(','); }

function startOfMonth(d) {
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}
function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
function pctDelta(curr, prev) {
  if (!prev) return null;
  const change = ((curr - prev) / prev) * 100;
  if (!isFinite(change)) return null;
  return Math.round(change);
}

/**
 * Compute every analytics datapoint from the real localStorage layer:
 *   - certificates registry
 *   - submission queue
 *   - user directory
 *   - fraud scan history
 */
async function buildAnalytics() {
  const [certs, submissions, users] = await Promise.all([
    listCertificates(),
    listSubmissions(),
    listUsers(),
  ]);
  const scans = listScans();
  const fraudStats = getFraudStats();

  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevMonthStart = startOfMonth(prevMonth);

  // -------- Stat-card metrics --------
  const issuedThisMonth = certs.filter((c) => new Date(c.issuedAt).getTime() >= currentMonthStart).length;
  const issuedLastMonth = certs.filter((c) => {
    const t = new Date(c.issuedAt).getTime();
    return t >= prevMonthStart && t < currentMonthStart;
  }).length;

  const approvedAll = submissions.filter((s) => s.status === 'approved');
  const approvedThisMonth = approvedAll.filter((s) => s.reviewedAt && new Date(s.reviewedAt).getTime() >= currentMonthStart).length;
  const approvedLastMonth = approvedAll.filter((s) => {
    if (!s.reviewedAt) return false;
    const t = new Date(s.reviewedAt).getTime();
    return t >= prevMonthStart && t < currentMonthStart;
  }).length;

  const totalLearningHours = certs.reduce((sum, c) => sum + (c.learningHours || 0), 0);

  // -------- 6-month issuance / submission trend --------
  const trend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = d.getTime();
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
    const issued = certs.filter((c) => {
      const t = new Date(c.issuedAt).getTime();
      return t >= start && t < end;
    }).length;
    const submitted = submissions.filter((s) => {
      const t = new Date(s.submittedAt).getTime();
      return t >= start && t < end;
    }).length;
    trend.push({ month: SHORT_MONTH[d.getMonth()], issued, submitted });
  }

  // -------- Certs by department --------
  const deptTally = {};
  certs.forEach((c) => {
    const key = c.department || 'Unassigned';
    deptTally[key] = (deptTally[key] || 0) + 1;
  });
  const byDepartment = Object.entries(deptTally)
    .map(([department, issued]) => ({ department, issued }))
    .sort((a, b) => b.issued - a.issued);

  // -------- Weekly engagement: total platform events per day --------
  const today0 = startOfDay(now);
  const weekly = [];
  for (let i = 6; i >= 0; i--) {
    const start = today0 - i * 86400000;
    const end = start + 86400000;
    const issued = certs.filter((c) => { const t = new Date(c.issuedAt).getTime(); return t >= start && t < end; }).length;
    const submitted = submissions.filter((s) => { const t = new Date(s.submittedAt).getTime(); return t >= start && t < end; }).length;
    const reviewed = submissions.filter((s) => s.reviewedAt && new Date(s.reviewedAt).getTime() >= start && new Date(s.reviewedAt).getTime() < end).length;
    const scanned = scans.filter((s) => s.at >= start && s.at < end).length;
    weekly.push({
      day: DAY_LABELS[new Date(start).getDay()],
      value: issued + submitted + reviewed + scanned,
    });
  }

  // -------- AI-style insights from real data --------
  const insights = [];
  if (byDepartment.length) {
    const top = byDepartment[0];
    insights.push(`${top.department} leads issuance with ${top.issued} certificate${top.issued === 1 ? '' : 's'} across the program.`);
  }
  const pending = submissions.filter((s) => s.status === 'pending').length;
  if (pending > 0) {
    insights.push(`${pending} submission${pending === 1 ? ' is' : 's are'} awaiting L&D review — clear them to keep learning hours flowing.`);
  } else {
    insights.push('No submissions are awaiting review — the approval queue is fully drained.');
  }
  if (fraudStats.threatsBlocked > 0) {
    insights.push(`${fraudStats.threatsBlocked} high-risk document${fraudStats.threatsBlocked === 1 ? '' : 's'} blocked by AI forensic detectors so far.`);
  } else {
    insights.push('No high-risk documents detected yet — the registry is clean.');
  }
  const weeklyTotal = weekly.reduce((a, b) => a + b.value, 0);
  insights.push(`${weeklyTotal} platform event${weeklyTotal === 1 ? '' : 's'} in the last 7 days · ${totalLearningHours} total learning hours awarded across ${certs.length} certificate${certs.length === 1 ? '' : 's'}.`);

  return {
    kpis: {
      issuedThisMonth,
      issuedDelta: pctDelta(issuedThisMonth, issuedLastMonth),
      approvedThisMonth,
      approvedDelta: pctDelta(approvedThisMonth, approvedLastMonth),
      totalLearningHours,
      threatsBlocked: fraudStats.threatsBlocked,
      threatsDelta: fraudStats.deltas.threats,
    },
    trend,
    byDepartment,
    weekly,
    fraudBreakdown: fraudStats.signalFailDistribution,
    insights,
    raw: { certs, submissions, users, scans, fraudStats, weekly },
  };
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

function buildReport(a) {
  const { certs, submissions, users } = a.raw;
  const pending = submissions.filter((s) => s.status === 'pending').length;
  const approved = submissions.filter((s) => s.status === 'approved').length;
  const rejected = submissions.filter((s) => s.status === 'rejected').length;
  const mavericks = users.filter((u) => u.role === 'maverick').length;
  const admins = users.filter((u) => u.role !== 'maverick').length;

  const lines = [];
  const now = new Date().toISOString();

  lines.push('Mavericks Certify — Analytics Report');
  lines.push(`Generated,${now}`);
  lines.push('');

  lines.push('# Key Metrics');
  lines.push(csvRow(['Metric', 'Value']));
  lines.push(csvRow(['Total certificates issued', certs.length]));
  lines.push(csvRow(['Issued this month', a.kpis.issuedThisMonth]));
  lines.push(csvRow(['Approved submissions (this month)', a.kpis.approvedThisMonth]));
  lines.push(csvRow(['Approved submissions (lifetime)', approved]));
  lines.push(csvRow(['Pending submissions', pending]));
  lines.push(csvRow(['Rejected submissions', rejected]));
  lines.push(csvRow(['Total learning hours awarded', a.kpis.totalLearningHours]));
  lines.push(csvRow(['Registered Mavericks', mavericks]));
  lines.push(csvRow(['Admin / L&D users', admins]));
  lines.push(csvRow(['Fraud scans run', a.raw.scans.length]));
  lines.push(csvRow(['Threats blocked', a.kpis.threatsBlocked]));
  lines.push('');

  lines.push('# 6-Month Issuance & Submission Trend');
  lines.push(csvRow(['Month', 'Issued', 'Submitted']));
  a.trend.forEach((r) => lines.push(csvRow([r.month, r.issued, r.submitted])));
  lines.push('');

  lines.push('# Certificates by Department');
  lines.push(csvRow(['Department', 'Issued']));
  a.byDepartment.forEach((r) => lines.push(csvRow([r.department, r.issued])));
  lines.push('');

  lines.push('# Fraud Signal Failure Distribution');
  lines.push(csvRow(['Signal', 'Failures']));
  a.fraudBreakdown.forEach((r) => lines.push(csvRow([r.name, r.value])));
  lines.push('');

  lines.push('# Last 7 Days — Platform Activity');
  lines.push(csvRow(['Day', 'Events']));
  a.weekly.forEach((r) => lines.push(csvRow([r.day, r.value])));
  lines.push('');

  lines.push('# AI-Generated Insights');
  a.insights.forEach((insight, i) => lines.push(csvRow([`Insight ${i + 1}`, insight])));
  lines.push('');

  lines.push('# Issued Certificate Registry');
  lines.push(csvRow(['Certificate ID', 'Recipient', 'Course', 'Department', 'Score', 'Learning Hours', 'Status', 'Issued At']));
  certs.forEach((c) => lines.push(csvRow([
    c.id, c.recipientName, c.course, c.department, c.score, c.learningHours || 0, c.status, c.issuedAt,
  ])));

  return lines.join('\n');
}

export default function Analytics() {
  const toast = useToast();
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    buildAnalytics().then((d) => {
      if (cancelled) return;
      setData(d);
      // Fire AI insights in the background — render template insights immediately,
      // swap to the LLM version when it arrives. Failures leave templates in place.
      if (!hasApiKey()) return;
      setAiLoading(true);
      const metrics = {
        totalCerts: d.raw.certs.length,
        issuedThisMonth: d.kpis.issuedThisMonth,
        topDepartment: d.byDepartment[0]
          ? { name: d.byDepartment[0].department, count: d.byDepartment[0].issued }
          : null,
        pendingSubmissions: d.raw.submissions.filter((s) => s.status === 'pending').length,
        approvedTotal: d.raw.submissions.filter((s) => s.status === 'approved').length,
        learningHours: d.kpis.totalLearningHours,
        threatsBlocked: d.kpis.threatsBlocked,
        weeklyEvents: d.weekly.reduce((a, b) => a + b.value, 0),
        mavericks: d.raw.users.filter((u) => u.role === 'maverick').length,
      };
      generateInsights(metrics)
        .then((insights) => {
          if (!cancelled && insights) setAiInsights(insights);
        })
        .finally(() => {
          if (!cancelled) setAiLoading(false);
        });
    });
    return () => { cancelled = true; };
  }, []);

  const handleExport = async () => {
    if (exporting || !data) return;
    setExporting(true);
    try {
      const csv = buildReport(data);
      const date = new Date().toISOString().slice(0, 10);
      downloadCsv(csv, `mavericks-certify-report-${date}.csv`);
      toast.success('Report downloaded as CSV');
    } catch (_) {
      toast.error('Could not generate report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const k = data?.kpis;
  const hasTrend = useMemo(() => data?.trend.some((r) => r.issued || r.submitted), [data]);
  const hasDept = useMemo(() => data?.byDepartment.some((d) => d.issued > 0), [data]);
  const hasWeekly = useMemo(() => data?.weekly.some((w) => w.value > 0), [data]);

  if (!data) {
    return (
      <div>
        <PageHeader eyebrow="Intelligence" icon={BarChart3} title="Analytics & Reporting" description="Executive-level insight into issuance, verification, departments and fraud." />
        <div className="flex h-64 items-center justify-center"><Spinner label="Computing analytics from registry…" /></div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Intelligence"
        icon={BarChart3}
        title="Analytics & Reporting"
        description="Executive-level insight into issuance, departments, engagement and fraud — derived from the live registry."
        actions={<Button variant="secondary" icon={Download} loading={exporting} onClick={handleExport}>Export report</Button>}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Issued this month" value={k.issuedThisMonth} icon={Award} tone="electric" delta={k.issuedDelta ?? undefined} />
        <StatCard label="Approved submissions (mo.)" value={k.approvedThisMonth} icon={ClipboardCheck} tone="cyan" delta={k.approvedDelta ?? undefined} delay={0.05} />
        <StatCard label="Learning hours awarded" value={k.totalLearningHours} suffix="h" icon={TrendingUp} tone="violet" delay={0.1} />
        <StatCard label="Fraud blocked" value={k.threatsBlocked} icon={ShieldAlert} tone="danger" delta={k.threatsDelta ?? undefined} delay={0.15} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-2">
          <h3 className="mb-1 font-semibold text-white">Issuance vs submissions</h3>
          <p className="mb-4 text-xs text-slate-500">Monthly volume over the last 6 months</p>
          {hasTrend ? (
            <TrendArea
              data={data.trend}
              keys={[{ key: 'issued', color: '#2f80ff' }, { key: 'submitted', color: '#06c8ff' }]}
              height={300}
            />
          ) : (
            <p className="py-16 text-center text-sm text-slate-500">No certificate or submission activity recorded yet.</p>
          )}
        </GlassCard>
        <GlassCard className="p-6">
          <h3 className="mb-1 font-semibold text-white">Fraud breakdown</h3>
          <p className="mb-2 text-xs text-slate-500">Failed signals across all scans</p>
          {data.fraudBreakdown.length ? (
            <DonutChart data={data.fraudBreakdown} height={260} />
          ) : (
            <p className="py-16 text-center text-sm text-slate-500">No fraud signals have failed across the recorded scans.</p>
          )}
        </GlassCard>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-2">
          <h3 className="mb-1 font-semibold text-white">Certificates by department</h3>
          <p className="mb-4 text-xs text-slate-500">Distribution across tracks · live from the registry</p>
          {hasDept ? (
            <GlowBars data={data.byDepartment} height={300} />
          ) : (
            <p className="py-16 text-center text-sm text-slate-500">No certificates have been issued yet.</p>
          )}
        </GlassCard>
        <GlassCard className="p-6">
          <h3 className="mb-1 font-semibold text-white">Weekly engagement</h3>
          <p className="mb-4 text-xs text-slate-500">Combined platform activity, last 7 days</p>
          {hasWeekly ? (
            <MiniBars data={data.weekly} height={240} />
          ) : (
            <p className="py-12 text-center text-sm text-slate-500">No platform events in the last 7 days.</p>
          )}
        </GlassCard>
      </div>

      {/* AI insights — render templates first, swap to LLM output on arrival. */}
      <GlassCard glow strong className="mt-6 p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
          <Brain className="h-5 w-5 text-electric-300" /> AI-generated insights
          <Badge tone={aiInsights ? 'electric' : 'neutral'} className="ml-1">
            {aiInsights ? 'Live · Claude' : aiLoading ? 'Generating…' : hasApiKey() ? 'Auto-updated' : 'Template mode'}
          </Badge>
        </h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {(aiInsights || data.insights).map((insight, i) => (
            <motion.div
              key={`${aiInsights ? 'ai' : 'tpl'}-${i}`}
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
