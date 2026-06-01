import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History, UploadCloud, Building2, GraduationCap, Clock, CheckCircle2, XCircle,
  Plus, FileText, MessageSquare, ChevronRight, Gauge, CalendarDays,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import { useAuthStore } from '@/store/authStore';
import { listSubmissions } from '@/services/submissionService';
import { formatDate, timeAgo, cn } from '@/lib/utils';

const STATUS = {
  pending: { tone: 'warning', icon: Clock, label: 'Pending review' },
  approved: { tone: 'success', icon: CheckCircle2, label: 'Approved' },
  rejected: { tone: 'danger', icon: XCircle, label: 'Rejected' },
};

const FILTERS = ['all', 'pending', 'approved', 'rejected'];

export default function MySubmissions() {
  const user = useAuthStore((s) => s.user);
  const [subs, setSubs] = useState(null);
  const [filter, setFilter] = useState('all');
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    listSubmissions({ submittedById: user.id })
      .then(setSubs)
      .catch(() => setSubs([])); // Empty state on failure instead of perpetual spinner.
  }, [user.id]);

  const counts = useMemo(() => {
    const c = { all: subs?.length || 0, pending: 0, approved: 0, rejected: 0 };
    subs?.forEach((s) => { c[s.status] += 1; });
    return c;
  }, [subs]);

  const visible = useMemo(
    () => (subs || []).filter((s) => filter === 'all' || s.status === filter),
    [subs, filter]
  );

  return (
    <div>
      <PageHeader
        eyebrow="Workflow"
        icon={History}
        title="My submissions"
        description="Track the status of every certificate you've submitted for review."
        actions={
          <Link to="/app/submit">
            <Button icon={Plus}>New submission</Button>
          </Link>
        }
      />

      {/* Status filter pills */}
      <div className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition-all',
              filter === f
                ? 'border-electric-400/50 bg-electric-500/15 text-white'
                : 'border-white/10 text-slate-400 hover:border-white/20 hover:text-white'
            )}
          >
            {f} <span className="ml-1 text-xs text-slate-500">{counts[f]}</span>
          </button>
        ))}
      </div>

      {!subs ? (
        <div className="flex h-48 items-center justify-center"><Spinner label="Loading submissions…" /></div>
      ) : visible.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-electric-500/15">
            <UploadCloud className="h-7 w-7 text-electric-300" />
          </div>
          <p className="font-display text-lg font-semibold text-white">
            {filter === 'all' ? 'No submissions yet' : `No ${filter} submissions`}
          </p>
          <p className="max-w-sm text-slate-400">Submit an internal assessment result or an external credential to get started.</p>
          <Link to="/app/submit"><Button icon={Plus} className="mt-2">Submit a certificate</Button></Link>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {visible.map((s, i) => {
              const st = STATUS[s.status];
              const external = s.type === 'external';
              return (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                >
                  <GlassCard hover className="cursor-pointer p-4" onClick={() => setDetail(s)}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-electric-500/15 text-electric-200">
                        {external ? <Building2 className="h-5 w-5" /> : <GraduationCap className="h-5 w-5" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white">{s.certificateName}</p>
                        <p className="truncate text-sm text-slate-500">
                          {external ? s.issuingOrg : 'Hexaware Mavericks Academy'} · {s.id}
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={external ? 'cyan' : 'electric'}>{external ? 'External' : 'Internal'}</Badge>
                        <Badge tone="neutral">Score {s.score}{external ? '' : '%'}</Badge>
                        <Badge tone={st.tone} dot><st.icon className="h-3 w-3" /> {st.label}</Badge>
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      </div>
                    </div>
                    {s.status === 'rejected' && s.adminComment && (
                      <div className="mt-3 flex items-start gap-2 rounded-lg border border-rose-500/20 bg-rose-500/5 p-2.5 text-sm text-rose-200">
                        <MessageSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <span>{s.adminComment}</span>
                      </div>
                    )}
                    {s.status === 'approved' && s.issuedCertId && (
                      <p className="mt-2 text-xs text-emerald-300">Certificate issued · {s.issuedCertId}</p>
                    )}
                  </GlassCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title="Submission detail" size="lg">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-electric-500/15 text-electric-200">
                {detail.type === 'external' ? <Building2 className="h-6 w-6" /> : <GraduationCap className="h-6 w-6" />}
              </div>
              <div>
                <p className="font-display text-lg font-semibold text-white">{detail.certificateName}</p>
                <p className="text-sm text-slate-400">{detail.type === 'external' ? detail.issuingOrg : 'Hexaware Mavericks Academy'}</p>
              </div>
              <Badge tone={STATUS[detail.status].tone} dot className="ml-auto">{STATUS[detail.status].label}</Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Meta icon={Gauge} label="Score" value={`${detail.score}${detail.type === 'external' ? '' : '%'}`} />
              <Meta icon={CalendarDays} label="Completed" value={detail.completionDate ? formatDate(detail.completionDate) : '—'} />
              <Meta icon={Clock} label="Submitted" value={timeAgo(detail.submittedAt)} />
              <Meta icon={FileText} label="Documents" value={detail.type === 'external' ? `${detail.documents?.length || 0} attached` : 'Not required'} />
            </div>

            {detail.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {detail.skills.map((s) => <Badge key={s} tone="violet">{s}</Badge>)}
              </div>
            )}

            {detail.remarks && (
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">Your remarks</p>
                <p className="text-sm text-slate-300">{detail.remarks}</p>
              </div>
            )}

            {detail.status !== 'pending' && (
              <div className={cn('rounded-xl border p-3', detail.status === 'approved' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5')}>
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-400">Admin decision</p>
                <p className="text-sm text-slate-200">{detail.adminComment || 'No comment provided.'}</p>
                <p className="mt-2 text-xs text-slate-500">{detail.reviewedBy} · {detail.reviewedAt ? formatDate(detail.reviewedAt) : ''}</p>
                {detail.issuedCertId && (
                  <Link to="/app/certificates" className="mt-2 inline-flex items-center gap-1 text-xs text-emerald-300 hover:text-emerald-200">
                    View issued certificate {detail.issuedCertId} <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            )}

            {detail.status === 'pending' && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-sm text-amber-200">
                <Clock className="h-4 w-4 shrink-0" /> Awaiting admin review. You'll be notified once a decision is made.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Meta({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className="truncate text-sm font-medium text-white">{value}</p>
    </div>
  );
}
