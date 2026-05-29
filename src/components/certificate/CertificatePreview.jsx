import { forwardRef } from 'react';
import { ShieldCheck, Award } from 'lucide-react';
import QRCode from './QRCode';
import { TEMPLATES } from '@/data/mockData';
import { formatDate, truncate } from '@/lib/utils';

/**
 * The rendered certificate artifact. Used in the generator preview, the
 * certificate detail modal and the verification result. Forwards a ref so
 * callers can snapshot / export it.
 */
const CertificatePreview = forwardRef(function CertificatePreview(
  { cert = {}, templateId, compact = false, className = '' },
  ref
) {
  const tpl = TEMPLATES.find((t) => t.id === (templateId || cert.templateId)) || TEMPLATES[0];
  const {
    recipientName = 'Recipient Name',
    course = 'Course Title',
    summary,
    score,
    duration,
    skills = [],
    id = 'HEX-MAV-2026-XXXXXX',
    issuedAt,
    manager = 'Program Manager',
    department = 'Hexaware Mavericks',
  } = cert;

  return (
    <div
      ref={ref}
      className={`relative aspect-[1.414/1] w-full overflow-hidden rounded-2xl bg-ink-800 ${className}`}
      style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
    >
      {/* Accent gradient header band */}
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: tpl.gradient }} />
      {/* Corner glow */}
      <div
        className="absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl opacity-40"
        style={{ background: tpl.accent }}
      />
      <div
        className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full blur-3xl opacity-30"
        style={{ background: tpl.accent }}
      />
      {/* Watermark seal */}
      <Award
        className="absolute right-6 top-1/2 h-64 w-64 -translate-y-1/2 opacity-[0.04]"
        style={{ color: tpl.accent }}
      />

      <div className={`relative flex h-full flex-col ${compact ? 'p-5' : 'p-7 md:p-9'}`}>
        {/* Brand row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: tpl.gradient }}>
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-display text-sm font-bold leading-none text-white">Mavericks Certify</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-400">Hexaware Technologies</p>
            </div>
          </div>
          <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-slate-300">
            Verified Credential
          </span>
        </div>

        {/* Body */}
        <div className={`flex flex-1 flex-col justify-center ${compact ? 'mt-3' : 'mt-5'}`}>
          <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">Certificate of Achievement</p>
          <p className="mt-1 text-xs text-slate-400">This is proudly presented to</p>
          <h2
            className={`font-display font-bold leading-tight text-white ${compact ? 'text-2xl' : 'text-3xl md:text-4xl'}`}
            style={{ textShadow: `0 0 30px ${tpl.accent}55` }}
          >
            {recipientName}
          </h2>
          <p className="mt-2 text-sm text-slate-300">
            for successfully completing{' '}
            <span className="font-semibold" style={{ color: tpl.accent }}>
              {course}
            </span>
          </p>

          {!compact && summary && (
            <p className="mt-3 max-w-2xl text-xs leading-relaxed text-slate-400">{truncate(summary, 220)}</p>
          )}

          {/* Stats */}
          <div className="mt-4 flex flex-wrap gap-2">
            {score != null && (
              <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                Score: <span className="font-semibold text-white">{score}%</span>
              </span>
            )}
            {duration && (
              <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300">
                Duration: <span className="font-semibold text-white">{duration}</span>
              </span>
            )}
            {skills.slice(0, compact ? 2 : 4).map((s) => (
              <span
                key={s}
                className="rounded-md px-2.5 py-1 text-[11px] font-medium"
                style={{ background: `${tpl.accent}22`, color: tpl.accent }}
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-end justify-between border-t border-white/10 pt-3">
          <div>
            <p className="font-display text-sm italic text-white" style={{ fontFamily: 'cursive' }}>
              {manager}
            </p>
            <div className="my-1 h-px w-28 bg-white/20" />
            <p className="text-[10px] text-slate-400">Program Manager · {department}</p>
            <p className="mt-1.5 text-[10px] text-slate-500">
              ID: {id} · Issued {formatDate(issuedAt)}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="rounded-lg bg-white p-1.5">
              <QRCode value={id} size={compact ? 52 : 64} />
            </div>
            <p className="text-[9px] text-slate-500">Scan to verify</p>
          </div>
        </div>
      </div>

      {/* Border frame */}
      <div className="pointer-events-none absolute inset-2 rounded-xl border border-white/10" />
    </div>
  );
});

export default CertificatePreview;
