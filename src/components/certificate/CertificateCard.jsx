import { motion } from 'framer-motion';
import { Award, ArrowUpRight, ShieldCheck } from 'lucide-react';
import { TEMPLATES } from '@/data/mockData';
import Badge from '@/components/ui/Badge';
import { formatDate } from '@/lib/utils';

const STATUS_TONE = { issued: 'success', pending: 'warning', revoked: 'danger' };

/** Compact certificate card for grids. */
export default function CertificateCard({ cert, onClick, index = 0 }) {
  const tpl = TEMPLATES.find((t) => t.id === cert.templateId) || TEMPLATES[0];
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 9) * 0.05 }}
      whileHover={{ y: -5 }}
      onClick={onClick}
      className="group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left backdrop-blur-xl transition-shadow hover:border-white/20 hover:shadow-glow"
    >
      <div className="absolute inset-x-0 top-0 h-1" style={{ background: tpl.gradient }} />
      <div
        className="absolute -right-10 -top-10 h-28 w-28 rounded-full blur-2xl opacity-30 transition-opacity group-hover:opacity-50"
        style={{ background: tpl.accent }}
      />
      <div className="relative flex items-start justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: `${tpl.accent}22` }}>
          <Award className="h-5.5 w-5.5" style={{ color: tpl.accent }} />
        </div>
        <ArrowUpRight className="h-4 w-4 text-slate-600 transition-colors group-hover:text-electric-300" />
      </div>
      <h3 className="relative mt-4 line-clamp-1 font-semibold text-white">{cert.course}</h3>
      <p className="relative mt-0.5 text-sm text-slate-400">{cert.recipientName}</p>

      <div className="relative mt-4 flex items-center justify-between">
        <Badge tone={STATUS_TONE[cert.status] || 'neutral'} dot>{cert.status}</Badge>
        {cert.score != null && <span className="text-xs text-slate-500">Score {cert.score}%</span>}
      </div>
      <div className="relative mt-3 flex items-center gap-1.5 text-[11px] text-slate-500">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
        {cert.id} · {formatDate(cert.issuedAt)}
      </div>
    </motion.button>
  );
}
