import { useEffect, useRef, useState } from 'react';
import { Sparkles, X, Building2, RefreshCw } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { suggestRejectionReason } from '@/services/aiService';
import { hasApiKey, lastClaudeError } from '@/services/anthropicClient';
import { useToast } from '@/store/toastStore';

/**
 * Focused reject dialog. Smaller than the full review modal — pops up from
 * the inline "Reject" button on each row. Includes an AI button that drafts
 * a polite, specific rejection reason from the submission's data, which the
 * admin can edit or send as-is.
 */
export default function RejectSubmissionModal({ submission, open, busy, onClose, onConfirm }) {
  const toast = useToast();
  const [reason, setReason] = useState('');
  const [suggesting, setSuggesting] = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setSuggesting(false);
    }
  }, [open, submission?.id]);

  // Grow the textarea to fit its content so AI output isn't crammed into
  // a fixed row count.
  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 360)}px`;
  }, [reason, open]);

  if (!submission) return null;

  const aiEnabled = hasApiKey();

  const handleSuggest = async () => {
    setSuggesting(true);
    try {
      const draft = await suggestRejectionReason(submission);
      if (draft) {
        setReason(draft);
        toast.info('AI drafted a rejection reason — edit or send as-is.');
      } else {
        const why = lastClaudeError();
        toast.error(why ? `AI failed — ${why}` : 'AI could not draft a reason. Type your own.');
      }
    } finally {
      setSuggesting(false);
    }
  };

  const handleConfirm = () => {
    const trimmed = reason.trim();
    if (!trimmed) {
      toast.error('Add a rejection reason before confirming.');
      return;
    }
    onConfirm(submission, trimmed);
  };

  return (
    <Modal
      open={open}
      onClose={!busy ? onClose : undefined}
      title="Reject submission"
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={!!busy}>Cancel</Button>
          <Button
            variant="danger"
            icon={X}
            loading={busy === 'rejected'}
            disabled={!!busy || !reason.trim()}
            onClick={handleConfirm}
          >
            Reject submission
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-300">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-white">{submission.certificateName}</p>
            <p className="truncate text-xs text-slate-500">
              {submission.submittedByName} · {submission.issuingOrg} · score {submission.score}
            </p>
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-slate-300">Rejection reason</label>
            {aiEnabled && (
              <button
                type="button"
                onClick={handleSuggest}
                disabled={suggesting || !!busy}
                className="flex items-center gap-1 text-xs text-electric-300 transition-colors hover:text-electric-200 disabled:opacity-50"
              >
                {suggesting
                  ? <><RefreshCw className="h-3 w-3 animate-spin" /> Drafting…</>
                  : <><Sparkles className="h-3 w-3" /> {reason ? 'Re-draft with AI' : 'Suggest with AI'}</>}
              </button>
            )}
          </div>
          <textarea
            ref={textRef}
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              aiEnabled
                ? 'Explain why this submission can\'t be approved. Or click "Suggest with AI" to have AI draft one for you.'
                : 'Explain why this submission can\'t be approved.'
            }
            className="block w-full resize-y min-h-[110px] max-h-[360px] overflow-auto break-words rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm leading-relaxed text-white placeholder:text-slate-500 transition-all focus:outline-none focus:bg-white/[0.06] focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400/50 hover:border-white/20"
          />
          <p className="mt-1.5 text-xs text-slate-500">
            The reason is sent to the Maverick as a notification and appears in their submissions list.
          </p>
        </div>
      </div>
    </Modal>
  );
}
