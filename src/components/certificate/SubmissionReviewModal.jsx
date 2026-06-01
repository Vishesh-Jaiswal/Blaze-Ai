import { useEffect, useRef, useState } from 'react';
import {
  Check, X, FileText, Image as ImageIcon, Building2, GraduationCap, Gauge,
  CalendarDays, User, MessageSquare, ExternalLink, ShieldCheck, Award, Clock,
  Sparkles, RefreshCw,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';
import { suggestRejectionReason, polishComment } from '@/services/aiService';
import { hasApiKey, lastClaudeError } from '@/services/anthropicClient';
import { useToast } from '@/store/toastStore';

function prettySize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const statusTone = { pending: 'warning', approved: 'success', rejected: 'danger' };

/**
 * Admin review modal: shows full submission detail, proof documents,
 * scores & metadata, and lets the admin approve or reject with a comment.
 */
export default function SubmissionReviewModal({ submission, open, onClose, onDecision, busy }) {
  const toast = useToast();
  const [comment, setComment] = useState('');
  const [hours, setHours] = useState(20);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [suggesting, setSuggesting] = useState(false);
  const commentRef = useRef(null);

  useEffect(() => {
    if (open) {
      setComment(submission?.adminComment || '');
      setHours(submission?.suggestedHours || 20);
      setPreviewDoc(null);
      setSuggesting(false);
    }
  }, [open, submission]);

  // Auto-grow the comment textarea to fit its content — so a polished
  // multi-sentence AI reply isn't crammed into a fixed 5-row box.
  useEffect(() => {
    const el = commentRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 360)}px`;
  }, [comment, open]);

  const handleAiSuggest = async () => {
    if (!submission) return;
    setSuggesting(true);
    try {
      // If the admin has already typed something, polish that into
      // professional English. If the field is empty, draft a fresh
      // rejection reason from scratch.
      const existing = comment.trim();
      const result = existing
        ? await polishComment(existing, submission)
        : await suggestRejectionReason(submission);
      if (result) {
        setComment(result);
        toast.info(existing ? 'AI polished your comment.' : 'AI drafted a rejection reason.');
      } else {
        const why = lastClaudeError();
        toast.error(why ? `AI failed — ${why}` : 'AI could not generate text. Try again.');
      }
    } finally {
      setSuggesting(false);
    }
  };

  if (!submission) return null;
  const decided = submission.status !== 'pending';
  const external = submission.type === 'external';

  return (
    <Modal open={open} onClose={onClose} title="Review submission" size="xl">
      <div className="grid gap-5 lg:grid-cols-5">
        {/* Detail column */}
        <div className="space-y-4 lg:col-span-3">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-electric-500/15 text-base font-bold text-electric-200">
              {submission.submittedByName.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold text-white">{submission.certificateName}</p>
              <p className="text-sm text-slate-400">{submission.submittedByName} · {submission.department}</p>
            </div>
            <div className="ml-auto flex flex-col items-end gap-1.5">
              <Badge tone={external ? 'cyan' : 'electric'} dot>
                {external ? <Building2 className="h-3 w-3" /> : <GraduationCap className="h-3 w-3" />}
                {external ? 'External' : 'Internal'}
              </Badge>
              <Badge tone={statusTone[submission.status]}>{submission.status}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field icon={Award} label="Certificate" value={submission.certificateName} />
            <Field icon={Building2} label="Issuing org" value={submission.issuingOrg} />
            <Field icon={Gauge} label="Score" value={`${submission.score}${external ? '' : '%'}`} />
            <Field icon={CalendarDays} label="Completed" value={submission.completionDate ? formatDate(submission.completionDate) : '—'} />
            <Field icon={User} label="Maverick" value={submission.submittedByName} />
            <Field icon={CalendarDays} label="Submitted" value={formatDate(submission.submittedAt)} />
          </div>

          {submission.skills?.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {submission.skills.map((s) => <Badge key={s} tone="violet">{s}</Badge>)}
              </div>
            </div>
          )}

          {submission.remarks && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <p className="mb-1 text-xs font-medium uppercase tracking-wider text-slate-500">Maverick remarks</p>
              <p className="text-sm text-slate-300">{submission.remarks}</p>
            </div>
          )}
        </div>

        {/* Documents + decision column */}
        <div className="space-y-4 lg:col-span-2">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
              <FileText className="h-3.5 w-3.5" /> Proof documents
            </p>
            {external && submission.documents?.length > 0 ? (
              <div className="space-y-2">
                {submission.documents.map((d) => (
                  <button
                    key={d.name}
                    type="button"
                    onClick={() => d.dataUrl && setPreviewDoc(d)}
                    className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-left transition-colors hover:border-electric-400/40"
                  >
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                      {d.type?.startsWith('image/')
                        ? <ImageIcon className="h-4.5 w-4.5 text-cyanglow-300" />
                        : <FileText className="h-4.5 w-4.5 text-electric-300" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-white">{d.name}</p>
                      <p className="text-xs text-slate-500">{prettySize(d.size)}{d.dataUrl ? ' · click to preview' : ' · preview unavailable'}</p>
                    </div>
                    {d.dataUrl && <ExternalLink className="h-4 w-4 text-slate-400" />}
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-sm text-slate-500">
                {external ? 'No documents attached' : 'Internal assessment — no upload required'}
              </p>
            )}
          </div>

          {previewDoc?.dataUrl && (
            <div className="overflow-hidden rounded-xl border border-white/10">
              <img src={previewDoc.dataUrl} alt={previewDoc.name} className="max-h-56 w-full object-contain bg-black/30" />
            </div>
          )}

          {decided ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
                <ShieldCheck className="h-3.5 w-3.5" /> Decision
              </p>
              <p className="text-sm text-slate-300">{submission.adminComment || 'No comment provided.'}</p>
              <p className="mt-2 text-xs text-slate-500">
                {submission.status} by {submission.reviewedBy} · {submission.reviewedAt ? formatDate(submission.reviewedAt) : ''}
              </p>
              {submission.issuedCertId && (
                <p className="mt-1 text-xs text-emerald-300">Issued certificate: {submission.issuedCertId}</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-300">
                  <Clock className="h-3.5 w-3.5" /> Learning hours to award
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={hours}
                    onChange={(e) => setHours(Math.max(0, Number(e.target.value) || 0))}
                    className="h-10 w-24 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white focus:border-electric-400/50 focus:outline-none focus:ring-2 focus:ring-electric-400/30"
                  />
                  <span className="text-xs text-slate-500">hours · added to the Maverick's total on approval</span>
                </div>
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="flex items-center gap-1.5 text-sm font-medium text-slate-300">
                    <MessageSquare className="h-3.5 w-3.5" /> Comment
                  </label>
                  {hasApiKey() && (
                    <button
                      type="button"
                      onClick={handleAiSuggest}
                      disabled={suggesting || !!busy}
                      className="flex items-center gap-1 text-xs text-electric-300 transition-colors hover:text-electric-200 disabled:opacity-50"
                    >
                      {suggesting
                        ? <><RefreshCw className="h-3 w-3 animate-spin" /> Working…</>
                        : <><Sparkles className="h-3 w-3" /> AI Suggest</>}
                    </button>
                  )}
                </div>
                <textarea
                  ref={commentRef}
                  rows={4}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a note for the Maverick (required when rejecting). Type a rough draft and click AI Suggest to polish it…"
                  className="block w-full resize-y min-h-[96px] max-h-[360px] overflow-auto break-words rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm leading-relaxed text-white placeholder:text-slate-500 transition-all focus:outline-none focus:bg-white/[0.06] focus:ring-2 focus:ring-electric-400/40 focus:border-electric-400/50 hover:border-white/20"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {!decided && (
        <div className="mt-5 flex items-center justify-end gap-3 border-t border-white/10 pt-4">
          <Button
            variant="danger"
            icon={X}
            loading={busy === 'rejected'}
            disabled={!!busy || !comment.trim()}
            onClick={() => onDecision(submission, 'rejected', comment.trim(), 0)}
          >
            Reject
          </Button>
          <Button
            variant="success"
            icon={Check}
            loading={busy === 'approved'}
            disabled={!!busy}
            onClick={() => onDecision(submission, 'approved', comment.trim(), hours)}
          >
            Approve &amp; issue
          </Button>
        </div>
      )}
    </Modal>
  );
}

function Field({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <p className="mb-1 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-slate-500">
        <Icon className="h-3.5 w-3.5" /> {label}
      </p>
      <p className="truncate text-sm font-medium text-white">{value || '—'}</p>
    </div>
  );
}
