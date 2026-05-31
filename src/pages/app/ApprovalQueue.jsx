import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardCheck, Check, X, Eye, Building2, Paperclip, Clock, Inbox,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import SubmissionReviewModal from '@/components/certificate/SubmissionReviewModal';
import { listSubmissions, reviewSubmission } from '@/services/submissionService';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/store/toastStore';
import { timeAgo } from '@/lib/utils';

export default function ApprovalQueue() {
  const user = useAuthStore((s) => s.user);
  const toast = useToast();
  const [items, setItems] = useState(null);
  const [selected, setSelected] = useState([]);
  const [review, setReview] = useState(null);
  const [busy, setBusy] = useState(null);
  const [bulkBusy, setBulkBusy] = useState(false);

  useEffect(() => {
    listSubmissions({ status: 'pending' }).then(setItems);
  }, []);

  const visible = items || [];

  const decide = async (submission, decision, comment, learningHours = 0) => {
    setBusy(decision);
    await reviewSubmission(submission.id, { decision, comment, reviewer: user.name, learningHours });
    setItems((list) => list.filter((s) => s.id !== submission.id));
    setSelected((s) => s.filter((x) => x !== submission.id));
    setBusy(null);
    setReview(null);
    toast[decision === 'approved' ? 'success' : 'warning'](
      decision === 'approved' ? `Approved — ${learningHours}h awarded & certificate issued` : 'Submission rejected'
    );
  };

  const bulkApprove = async () => {
    setBulkBusy(true);
    const ids = [...selected];
    for (const id of ids) {
      const sub = items.find((s) => s.id === id);
      if (sub) await reviewSubmission(id, { decision: 'approved', comment: 'Bulk approved', reviewer: user.name, learningHours: 20 });
    }
    setItems((list) => list.filter((s) => !ids.includes(s.id)));
    setSelected([]);
    setBulkBusy(false);
    toast.success(`${ids.length} certificate${ids.length > 1 ? 's' : ''} approved & 20h each awarded`);
  };

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  return (
    <div>
      <PageHeader
        eyebrow="Workflow"
        icon={ClipboardCheck}
        title="Pending approvals"
        description="Review Maverick-submitted external credentials with proof documents. Approve to issue, or reject with a reason."
        actions={
          selected.length > 0 && (
            <Button icon={Check} variant="success" loading={bulkBusy} onClick={bulkApprove}>
              Approve {selected.length} selected
            </Button>
          )
        }
      />

      {!items ? (
        <div className="flex h-48 items-center justify-center"><Spinner label="Loading queue…" /></div>
      ) : visible.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15">
            <Inbox className="h-7 w-7 text-emerald-400" />
          </div>
          <p className="font-display text-lg font-semibold text-white">All caught up!</p>
          <p className="text-slate-400">There are no pending submissions to review right now.</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {visible.map((s, i) => (
                <motion.div
                  key={s.id}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -40, height: 0 }}
                  transition={{ delay: Math.min(i * 0.04, 0.3) }}
                >
                  <GlassCard className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                    <input
                      type="checkbox"
                      checked={selected.includes(s.id)}
                      onChange={() => toggle(s.id)}
                      className="h-5 w-5 shrink-0 rounded border-white/20 bg-white/5 accent-electric-500"
                    />
                    <div className="flex flex-1 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-electric-500/15 text-electric-200">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-medium text-white">{s.certificateName}</p>
                        <p className="truncate text-sm text-slate-500">
                          {s.submittedByName} · {s.issuingOrg}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="neutral">Score {s.score}</Badge>
                      {s.documents?.length > 0 && (
                        <Badge tone="violet"><Paperclip className="h-3 w-3" /> {s.documents.length}</Badge>
                      )}
                      <Badge tone="warning"><Clock className="h-3 w-3" /> {timeAgo(s.submittedAt)}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" icon={Eye} onClick={() => setReview(s)}>Review</Button>
                      <Button size="sm" variant="success" icon={Check} loading={busy === 'approved' && review?.id === s.id} onClick={() => decide(s, 'approved', 'Approved', 20)}>Approve</Button>
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
          </AnimatePresence>
        </div>
      )}

      <SubmissionReviewModal
        submission={review}
        open={!!review}
        busy={busy}
        onClose={() => !busy && setReview(null)}
        onDecision={decide}
      />
    </div>
  );
}
