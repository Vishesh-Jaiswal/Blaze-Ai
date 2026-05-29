import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ScanLine, ShieldCheck, ShieldAlert, ShieldX, Search, Upload, Hash, Boxes,
  CheckCircle2, XCircle, FileText, RotateCcw, Clock,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import CertificatePreview from '@/components/certificate/CertificatePreview';
import { Gauge } from '@/components/charts/Charts';
import { verifyById, verifyUpload } from '@/services/verificationService';
import { SEED_CERTIFICATES, VERIFICATION_LOG } from '@/data/mockData';
import { timeAgo } from '@/lib/utils';

const RESULT_UI = {
  authentic: { icon: ShieldCheck, color: '#10b981', tone: 'success', title: 'Authentic' },
  revoked: { icon: ShieldX, color: '#f43f5e', tone: 'danger', title: 'Revoked' },
  not_found: { icon: ShieldX, color: '#f43f5e', tone: 'danger', title: 'Not Found' },
  suspicious: { icon: ShieldAlert, color: '#f59e0b', tone: 'warning', title: 'Suspicious' },
};

export default function VerificationPortal({ embedded = true }) {
  const [params] = useSearchParams();
  const [mode, setMode] = useState('id'); // id | upload
  const [certId, setCertId] = useState(params.get('id') || '');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState('');

  const runIdVerify = async (idArg) => {
    const id = (idArg ?? certId).trim();
    if (!id) return;
    setLoading(true);
    setResult(null);
    const res = await verifyById(id);
    setResult(res);
    setLoading(false);
  };

  // Auto-verify when arriving with ?id=
  useEffect(() => {
    const id = params.get('id');
    if (id) {
      setCertId(id);
      runIdVerify(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    setResult(null);
    const res = await verifyUpload(file);
    setResult(res);
    setLoading(false);
  };

  const reset = () => {
    setResult(null);
    setCertId('');
    setFileName('');
  };

  return (
    <div className={embedded ? '' : 'mx-auto max-w-5xl px-6 py-12'}>
      <PageHeader
        eyebrow="Trust & Verification"
        icon={ScanLine}
        title="Certificate Verification Portal"
        description="Confirm the authenticity of any Mavericks certificate instantly — by ID, QR or file upload."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {/* Verify panel */}
        <div className="space-y-5">
          <GlassCard glow className="p-6">
            {/* Mode toggle */}
            <div className="mb-5 flex rounded-xl border border-white/10 bg-white/[0.02] p-1">
              {[
                { id: 'id', label: 'By ID / QR', icon: Hash },
                { id: 'upload', label: 'Upload file', icon: Upload },
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setMode(m.id); reset(); }}
                  className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-colors ${mode === m.id ? 'text-white' : 'text-slate-400'}`}
                >
                  {mode === m.id && <motion.span layoutId="verify-tab" className="absolute inset-0 rounded-lg bg-electric-gradient shadow-glow-sm" />}
                  <span className="relative flex items-center gap-2"><m.icon className="h-4 w-4" /> {m.label}</span>
                </button>
              ))}
            </div>

            {mode === 'id' ? (
              <div className="space-y-4">
                {/* QR scanner visual */}
                <div className="relative mx-auto h-44 w-44 overflow-hidden rounded-2xl border border-electric-400/30 bg-ink-800">
                  <div className="absolute inset-4 rounded-xl border-2 border-dashed border-electric-400/30" />
                  <ScanLine className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 text-electric-400/50" />
                  <motion.div
                    className="absolute inset-x-4 h-0.5 bg-electric-400 shadow-[0_0_12px_#2f80ff]"
                    animate={{ top: ['12%', '88%', '12%'] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  <input
                    value={certId}
                    onChange={(e) => setCertId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && runIdVerify()}
                    placeholder="Enter certificate ID (e.g. HEX-MAV-2026-…)"
                    className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-electric-400/50 focus:outline-none focus:ring-2 focus:ring-electric-400/30"
                  />
                </div>
                <Button className="w-full" icon={ShieldCheck} loading={loading} onClick={() => runIdVerify()}>Verify certificate</Button>
                {/* sample ids */}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-slate-500">Try:</span>
                  {SEED_CERTIFICATES.slice(0, 2).map((c) => (
                    <button key={c.id} onClick={() => { setCertId(c.id); runIdVerify(c.id); }} className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-[11px] text-electric-200 hover:bg-electric-500/15">{c.id}</button>
                  ))}
                  <button onClick={() => { setCertId('HEX-MAV-2026-FAKE01'); runIdVerify('HEX-MAV-2026-FAKE01'); }} className="rounded-md bg-rose-500/10 px-2 py-0.5 font-mono text-[11px] text-rose-300 hover:bg-rose-500/20">invalid id</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => fileRef.current?.click()}
                  className="flex h-44 w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] transition-colors hover:border-electric-400/40 hover:bg-electric-500/5"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-electric-500/15"><FileText className="h-6 w-6 text-electric-300" /></div>
                  <p className="text-sm text-slate-300">{fileName || 'Click to upload a certificate file'}</p>
                  <p className="text-xs text-slate-500">PDF, PNG or JPG · tamper-checked by AI</p>
                </button>
                <input ref={fileRef} type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleFile} />
                <p className="text-center text-xs text-slate-500">Tip: name a file with “copy” or “fake” to simulate a flagged document.</p>
              </div>
            )}
          </GlassCard>

          {/* Recent verifications */}
          {!embedded ? null : (
            <GlassCard className="p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-white"><Clock className="h-4 w-4 text-electric-300" /> Recent verifications</h3>
              <div className="space-y-2">
                {VERIFICATION_LOG.slice(0, 4).map((v) => {
                  const ui = RESULT_UI[v.result] || RESULT_UI.authentic;
                  return (
                    <div key={v.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-2.5">
                      <div className="min-w-0">
                        <p className="truncate text-sm text-white">{v.recipient}</p>
                        <p className="text-xs text-slate-500">{v.verifiedBy} · {timeAgo(v.at)}</p>
                      </div>
                      <Badge tone={ui.tone} dot>{v.result}</Badge>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          )}
        </div>

        {/* Result panel */}
        <div>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <GlassCard className="flex h-full min-h-[400px] flex-col items-center justify-center gap-4 p-8">
                  <Spinner size={44} />
                  <p className="text-slate-300">Running cryptographic & AI authenticity checks…</p>
                  <div className="w-full max-w-xs space-y-2">
                    {['Querying ledger', 'Validating hash', 'Scanning for tampering'].map((s, i) => (
                      <motion.div key={s} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.4 }} className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="h-1.5 w-1.5 rounded-full bg-electric-400" /> {s}…
                      </motion.div>
                    ))}
                  </div>
                </GlassCard>
              </motion.div>
            ) : result ? (
              <ResultCard key="result" result={result} onReset={reset} />
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <GlassCard className="flex h-full min-h-[400px] flex-col items-center justify-center gap-3 p-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-electric-500/10"><ShieldCheck className="h-8 w-8 text-electric-300" /></div>
                  <p className="font-display text-lg font-semibold text-white">Awaiting verification</p>
                  <p className="max-w-xs text-sm text-slate-400">Enter a certificate ID or upload a file to instantly confirm its authenticity.</p>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ result, onReset }) {
  const ui = RESULT_UI[result.result] || RESULT_UI.authentic;
  const Icon = ui.icon;
  const authentic = result.result === 'authentic';

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
      <GlassCard glow strong className="overflow-hidden">
        {/* Banner */}
        <div className="relative p-6" style={{ background: `linear-gradient(135deg, ${ui.color}22, transparent)` }}>
          <div className="flex items-center gap-4">
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
              className="flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: `${ui.color}22` }}>
              <Icon className="h-8 w-8" style={{ color: ui.color }} />
            </motion.div>
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400">Verification result</p>
              <h3 className="font-display text-2xl font-bold" style={{ color: ui.color }}>{ui.title}</h3>
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-300">{result.message}</p>
        </div>

        <div className="space-y-5 p-6">
          {/* Confidence gauge */}
          <div className="grid grid-cols-2 items-center gap-4">
            <Gauge value={result.confidence} color={ui.color} label="confidence" height={150} />
            <div className="space-y-2">
              {result.blockHeight && (
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-2.5 text-xs">
                  <Boxes className="h-4 w-4 text-electric-300" />
                  <span className="text-slate-400">Block</span>
                  <span className="ml-auto font-mono text-white">#{result.blockHeight.toLocaleString()}</span>
                </div>
              )}
              {result.cert?.hash && (
                <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-2.5 text-xs">
                  <Hash className="h-4 w-4 text-electric-300" />
                  <span className="truncate font-mono text-slate-400">{result.cert.hash.slice(0, 18)}…</span>
                </div>
              )}
              <div className="rounded-lg border border-white/10 bg-white/[0.02] p-2.5 text-xs text-slate-400">
                ID: <span className="font-mono text-white">{result.certId || result.cert?.id || '—'}</span>
              </div>
            </div>
          </div>

          {/* Checks */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Security checks</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {result.checks.map((c, i) => (
                <motion.div key={c.label} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.02] p-2.5 text-sm">
                  {c.pass ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-rose-400" />}
                  <span className="text-slate-300">{c.label}</span>
                  {c.note && <span className="ml-auto text-xs text-rose-300">{c.note}</span>}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Verified certificate preview */}
          {authentic && result.cert && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Verified credential</p>
              <CertificatePreview cert={result.cert} compact />
            </div>
          )}

          <Button variant="secondary" icon={RotateCcw} className="w-full" onClick={onReset}>Verify another</Button>
        </div>
      </GlassCard>
    </motion.div>
  );
}
