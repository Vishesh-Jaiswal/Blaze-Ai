import { Download, ShieldCheck, Hash, Copy, ScanLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import CertificatePreview from './CertificatePreview';
import { downloadCertificateHtml } from '@/lib/certificateExport';
import { useToast } from '@/store/toastStore';
import { formatDate } from '@/lib/utils';

const STATUS_TONE = { issued: 'success', pending: 'warning', revoked: 'danger' };

export default function CertificateModal({ cert, open, onClose }) {
  const toast = useToast();
  const navigate = useNavigate();
  if (!cert) return null;

  const copyHash = () => {
    navigator.clipboard?.writeText(cert.hash || cert.id);
    toast.success('Hash copied to clipboard');
  };

  return (
    <Modal open={open} onClose={onClose} title="Certificate details" size="xl">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <CertificatePreview cert={cert} />

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge tone={STATUS_TONE[cert.status] || 'neutral'} dot>{cert.status}</Badge>
            <Badge tone="electric">{cert.verifications ?? 0} verifications</Badge>
          </div>

          <div className="space-y-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm">
            <Row label="Recipient" value={cert.recipientName} />
            <Row label="Course" value={cert.course} />
            <Row label="Department" value={cert.department} />
            <Row label="Score" value={cert.score != null ? `${cert.score}%` : '—'} />
            <Row label="Duration" value={cert.duration || '—'} />
            <Row label="Issued" value={formatDate(cert.issuedAt)} />
            <Row label="Issued by" value={cert.issuedBy || 'Hexaware Mavericks Academy'} />
          </div>

          <button
            onClick={copyHash}
            className="flex w-full items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition-colors hover:border-electric-400/40"
          >
            <Hash className="h-4 w-4 shrink-0 text-electric-300" />
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-slate-400">{cert.hash || cert.id}</span>
            <Copy className="h-4 w-4 shrink-0 text-slate-500" />
          </button>

          <div className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
            <ShieldCheck className="h-4 w-4" /> Recorded on the Hexaware verification ledger.
          </div>

          <div className="flex gap-2">
            <Button icon={Download} className="flex-1" onClick={() => { downloadCertificateHtml(cert); toast.success('Certificate exported — open & print to PDF'); }}>
              Download
            </Button>
            <Button variant="secondary" icon={ScanLine} onClick={() => navigate(`/app/verify?id=${cert.id}`)}>
              Verify
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-medium text-white">{value}</span>
    </div>
  );
}
