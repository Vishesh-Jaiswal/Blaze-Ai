import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Wand2, Award, Download, RefreshCw, Check, Plus, X, Brain, Palette, Send, FileText,
  ImagePlus, Trash2,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import CertificatePreview from '@/components/certificate/CertificatePreview';
import { COURSES, DEPARTMENTS, SKILL_BANK, TEMPLATES } from '@/data/mockData';
import { generateAchievementSummary, recommendTemplate, suggestSkills } from '@/services/aiService';
import { createCertificate } from '@/services/certificateService';
import { listUsers } from '@/services/authService';
import { trackEvent, EVENT_TYPES } from '@/services/activityService';
import { viewCertificatePdf, downloadCertificatePdf } from '@/lib/certificateExport';
import { useToast } from '@/store/toastStore';
import { cn } from '@/lib/utils';
import { ROLES } from '@/config/roles';

const STEPS = ['Details', 'AI Narrative', 'Design', 'Issue'];

export default function CertificateGenerator() {
  const toast = useToast();
  const previewRef = useRef(null);
  const [pdfBusy, setPdfBusy] = useState(null);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    recipientId: '',
    recipientName: '',
    recipientEmail: '',
    course: COURSES[0],
    department: DEPARTMENTS[0],
    score: 92,
    duration: '8 weeks',
    learningHours: 40,
    skills: ['React', 'System Design'],
    managerFeedback: '',
    templateId: 'aurora',
    backgroundImage: null,
  });
  const bgInputRef = useRef(null);
  const [mavericks, setMavericks] = useState([]);

  // Load all registered Mavericks for the recipient dropdown.
  useEffect(() => {
    listUsers({ role: ROLES.MAVERICK }).then(setMavericks);
  }, []);
  const [summary, setSummary] = useState('');
  const [generating, setGenerating] = useState(false);
  const [regenCount, setRegenCount] = useState(0);
  const [recommending, setRecommending] = useState(false);
  const [recommendation, setRecommendation] = useState(null);
  const [issued, setIssued] = useState(null);
  const [skillInput, setSkillInput] = useState('');

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));

  const cert = {
    ...form,
    id: issued?.id || 'HEX-MAV-2026-PREVIEW',
    summary,
    issuedAt: issued?.issuedAt || new Date().toISOString(),
    manager: 'Hexaware Mavericks Academy',
  };

  const handleViewPdf = async () => {
    if (pdfBusy) return;
    setPdfBusy('view');
    try { await viewCertificatePdf(previewRef.current, cert); }
    catch (_) { toast.error('Could not open PDF'); }
    finally { setPdfBusy(null); }
  };

  const handleDownloadPdf = async () => {
    if (pdfBusy) return;
    setPdfBusy('download');
    try { await downloadCertificatePdf(previewRef.current, cert); toast.success('PDF downloaded'); }
    catch (_) { toast.error('Could not generate PDF'); }
    finally { setPdfBusy(null); }
  };

  const addSkill = (s) => {
    const skill = (s || skillInput).trim();
    if (skill && !form.skills.includes(skill)) set('skills')([...form.skills, skill]);
    setSkillInput('');
  };
  const removeSkill = (s) => set('skills')(form.skills.filter((x) => x !== s));

  const handleBackgroundUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!/^image\//.test(file.type)) {
      toast.error('Pick an image file (PNG / JPG / WEBP).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      set('backgroundImage')(reader.result);
      toast.success('Background image applied to the certificate.');
    };
    reader.onerror = () => toast.error('Could not read that file.');
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearBackground = () => {
    set('backgroundImage')(null);
    toast.info('Background image removed.');
  };

  const handleSuggestSkills = async () => {
    const s = await suggestSkills(form.course);
    // Replace the existing skill list with the AI's fresh picks so changing
    // the course produces a clean new set rather than a stacked accumulation.
    set('skills')([...new Set(s)].slice(0, 6));
    toast.info('AI suggested skills based on the course');
  };

  const handleGenerate = async () => {
    if (!form.recipientId || !form.recipientName.trim()) return toast.error('Pick a Maverick to issue this to first');
    setGenerating(true);
    try {
      const text = await generateAchievementSummary(form, { nonce: regenCount });
      setSummary(text);
      setStep(1);
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = async () => {
    setGenerating(true);
    try {
      const nextNonce = regenCount + 1;
      setRegenCount(nextNonce);
      const text = await generateAchievementSummary(form, { nonce: nextNonce });
      setSummary(text);
      toast.info('AI regenerated a fresh narrative variant');
    } finally {
      setGenerating(false);
    }
  };

  const handleRecommend = async () => {
    setRecommending(true);
    try {
      const rec = await recommendTemplate(form);
      setRecommendation(rec);
      set('templateId')(rec.templateId);
      toast.success(`AI recommends the “${TEMPLATES.find((t) => t.id === rec.templateId)?.name}” template`);
    } finally {
      setRecommending(false);
    }
  };

  const handleIssue = async () => {
    try {
      const created = await createCertificate({ ...form, summary });
      setIssued(created);
      setStep(3);
      // Notify the recipient Maverick — log to THEIR activity feed.
      if (form.recipientId) {
        trackEvent(form.recipientId, EVENT_TYPES.ISSUED, {
          certificateName: form.course,
          certId: created.id,
          learningHours: form.learningHours,
          issuedBy: 'Hexaware Mavericks Academy',
        });
      }
      toast.success('Certificate issued & recorded on the ledger!');
    } catch (err) {
      toast.error(`Could not issue certificate — ${err?.message || 'try again'}`);
    }
  };

  const reset = () => {
    setIssued(null);
    setSummary('');
    setStep(0);
    setForm((f) => ({ ...f, recipientId: '', recipientName: '', recipientEmail: '', managerFeedback: '', backgroundImage: null }));
  };

  return (
    <div>
      <PageHeader
        eyebrow="AI Engine"
        icon={Sparkles}
        title="AI Certificate Generator"
        description="Generate personalised, fraud-proof certificates in seconds — narrative, design and verification handled by AI."
      />

      {/* Stepper */}
      <div className="mb-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex flex-1 items-center gap-2">
            <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors',
              i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-electric-gradient text-white shadow-glow-sm' : 'bg-white/5 text-slate-500')}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span className={cn('hidden text-sm sm:block', i === step ? 'text-white' : 'text-slate-500')}>{s}</span>
            {i < STEPS.length - 1 && <div className={cn('h-px flex-1', i < step ? 'bg-emerald-500/50' : 'bg-white/10')} />}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
        {/* LEFT: controls */}
        <div className="space-y-5">
          <AnimatePresence mode="wait">
            {/* STEP 0 — Details */}
            {step === 0 && (
              <motion.div key="details" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                <GlassCard className="space-y-4 p-6">
                  <h3 className="flex items-center gap-2 font-semibold text-white"><Wand2 className="h-4 w-4 text-electric-300" /> Achievement details</h3>
                  <RecipientPicker
                    mavericks={mavericks}
                    selected={form.recipientId}
                    onSelect={(m) => setForm((f) => ({
                      ...f,
                      recipientId: m.id,
                      recipientName: m.name,
                      recipientEmail: m.email,
                      department: m.department || f.department,
                    }))}
                  />
                  <Select label="Course / Program" value={form.course} onChange={set('course')} options={COURSES} />
                  <div className="grid grid-cols-2 gap-4">
                    <Select label="Department" value={form.department} onChange={set('department')} options={DEPARTMENTS} />
                    <Input label="Duration" value={form.duration} onChange={set('duration')} />
                  </div>
                  <Input
                    label="Learning hours awarded"
                    type="number"
                    min="0"
                    max="500"
                    value={form.learningHours}
                    onChange={(e) => set('learningHours')(Math.max(0, Number(e.target.value) || 0))}
                    hint="Added to the Maverick's total learning hours on the leaderboard."
                  />
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-300">Assessment score: <span className="text-electric-300">{form.score}%</span></label>
                    <input type="range" min="60" max="100" value={form.score} onChange={set('score')} className="w-full accent-electric-500" />
                  </div>

                  {/* Skills */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="text-sm font-medium text-slate-300">Skill tags</label>
                      <button onClick={handleSuggestSkills} className="flex items-center gap-1 text-xs text-electric-300 hover:text-electric-200">
                        <Sparkles className="h-3 w-3" /> AI suggest
                      </button>
                    </div>
                    <div className="mb-2 flex flex-wrap gap-2">
                      {form.skills.map((s) => (
                        <span key={s} className="flex items-center gap-1 rounded-lg bg-electric-500/15 px-2.5 py-1 text-xs text-electric-200">
                          {s}<button onClick={() => removeSkill(s)}><X className="h-3 w-3" /></button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        list="skillbank" value={skillInput} onChange={(e) => setSkillInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                        placeholder="Add a skill…"
                        className="h-10 flex-1 rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white placeholder:text-slate-500 focus:border-electric-400/50 focus:outline-none"
                      />
                      <datalist id="skillbank">{SKILL_BANK.map((s) => <option key={s} value={s} />)}</datalist>
                      <Button size="sm" variant="secondary" icon={Plus} onClick={() => addSkill()}>Add</Button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-slate-300">Manager feedback <span className="text-slate-500">(optional)</span></label>
                    <textarea
                      value={form.managerFeedback} onChange={set('managerFeedback')} rows={2}
                      placeholder="A short endorsement to weave into the AI narrative…"
                      className="w-full rounded-xl border border-white/10 bg-white/[0.03] p-3 text-sm text-white placeholder:text-slate-500 focus:border-electric-400/50 focus:outline-none focus:ring-2 focus:ring-electric-400/30"
                    />
                  </div>

                  <Button className="w-full" icon={Brain} loading={generating} onClick={handleGenerate}>
                    Generate AI narrative
                  </Button>
                </GlassCard>
              </motion.div>
            )}

            {/* STEP 1 — Narrative */}
            {step === 1 && (
              <motion.div key="narrative" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                <GlassCard glow className="space-y-4 p-6">
                  <h3 className="flex items-center gap-2 font-semibold text-white"><Brain className="h-4 w-4 text-electric-300" /> AI-generated achievement summary</h3>
                  <div className="rounded-xl border border-electric-400/20 bg-electric-500/5 p-4">
                    <textarea
                      value={summary} onChange={(e) => setSummary(e.target.value)} rows={7}
                      className="w-full resize-none bg-transparent text-sm leading-relaxed text-slate-200 focus:outline-none"
                    />
                  </div>
                  <p className="text-xs text-slate-500">You can edit the narrative above before continuing.</p>
                  <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => setStep(0)}>Back</Button>
                    <Button variant="secondary" icon={RefreshCw} loading={generating} onClick={handleRegenerate}>Regenerate</Button>
                    <Button className="flex-1" icon={Palette} onClick={() => setStep(2)}>Choose design</Button>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* STEP 2 — Design */}
            {step === 2 && (
              <motion.div key="design" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}>
                <GlassCard className="space-y-4 p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="flex items-center gap-2 font-semibold text-white"><Palette className="h-4 w-4 text-electric-300" /> Smart design engine</h3>
                    <button onClick={handleRecommend} className="flex items-center gap-1 text-xs text-electric-300 hover:text-electric-200">
                      <Sparkles className="h-3 w-3" /> {recommending ? 'Thinking…' : 'AI recommend'}
                    </button>
                  </div>
                  {recommendation && (
                    <div className="rounded-xl border border-violetglow-400/20 bg-violetglow-500/10 p-3 text-xs text-violetglow-200">
                      <Sparkles className="mr-1 inline h-3 w-3" /> {recommendation.reason} <Badge tone="violet" className="ml-1">{recommendation.confidence}% match</Badge>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.id} onClick={() => set('templateId')(t.id)}
                        className={cn('relative overflow-hidden rounded-xl border p-4 text-left transition-all',
                          form.templateId === t.id ? 'border-electric-400/60 ring-2 ring-electric-400/40' : 'border-white/10 hover:border-white/30')}
                      >
                        <div className="mb-3 h-14 w-full rounded-lg" style={{ background: t.gradient }} />
                        <p className="text-sm font-semibold text-white">{t.name}</p>
                        <p className="mt-0.5 text-[11px] leading-snug text-slate-400">{t.vibe}</p>
                        {form.templateId === t.id && <Check className="absolute right-3 top-3 h-4 w-4 text-electric-300" />}
                      </button>
                    ))}
                  </div>

                  {/* Optional custom background image */}
                  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="flex items-center gap-2 text-sm font-medium text-slate-300">
                        <ImagePlus className="h-4 w-4 text-electric-300" /> Custom background
                      </p>
                      {form.backgroundImage && (
                        <button
                          type="button"
                          onClick={clearBackground}
                          className="flex items-center gap-1 text-[11px] text-rose-300 hover:text-rose-200"
                        >
                          <Trash2 className="h-3 w-3" /> Remove
                        </button>
                      )}
                    </div>
                    {form.backgroundImage ? (
                      <div className="flex items-center gap-3">
                        <img src={form.backgroundImage} alt="Background preview" className="h-16 w-24 shrink-0 rounded-lg border border-white/10 object-cover" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-300">Image applied to the certificate background.</p>
                          <button
                            type="button"
                            onClick={() => bgInputRef.current?.click()}
                            className="mt-1 text-[11px] text-electric-300 hover:text-electric-200"
                          >
                            Replace image
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => bgInputRef.current?.click()}
                        className="flex h-16 w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-white/10 bg-white/[0.02] text-xs text-slate-400 transition-colors hover:border-electric-400/40 hover:text-electric-200"
                      >
                        <ImagePlus className="h-4 w-4" /> Upload image (PNG / JPG, ≤ 2 MB)
                      </button>
                    )}
                    <input
                      ref={bgInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleBackgroundUpload}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => setStep(1)}>Back</Button>
                    <Button className="flex-1" icon={Send} onClick={handleIssue}>Issue certificate</Button>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* STEP 3 — Issued */}
            {step === 3 && issued && (
              <motion.div key="issued" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <GlassCard glow strong className="space-y-4 p-6 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200 }}
                    className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                    <Check className="h-8 w-8 text-emerald-400" />
                  </motion.div>
                  <h3 className="font-display text-xl font-bold text-white">Certificate issued!</h3>
                  <p className="text-sm text-slate-400">Recorded on the Hexaware ledger and ready to share.</p>
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 font-mono text-xs text-electric-200">{issued.id}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button icon={FileText} loading={pdfBusy === 'view'} disabled={!!pdfBusy} onClick={handleViewPdf}>View PDF</Button>
                    <Button variant="secondary" icon={Download} loading={pdfBusy === 'download'} disabled={!!pdfBusy} onClick={handleDownloadPdf}>Download</Button>
                    <Button variant="ghost" icon={RefreshCw} className="col-span-2" onClick={reset}>New certificate</Button>
                  </div>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: live preview */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-3 flex items-center justify-between">
            <p className="flex items-center gap-2 text-sm text-slate-400"><Award className="h-4 w-4 text-electric-300" /> Live preview</p>
            <Badge tone="electric" dot>Real-time</Badge>
          </div>
          <motion.div layout transition={{ type: 'spring', stiffness: 200, damping: 24 }}>
            <CertificatePreview ref={previewRef} cert={cert} templateId={form.templateId} />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/**
 * Searchable Maverick picker. Shows name + email for each candidate.
 * Empty registry → shows a helpful empty state instead of an unusable input.
 */
function RecipientPicker({ mavericks, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const ref = useRef(null);
  const selectedM = mavericks.find((m) => m.id === selected);

  useEffect(() => {
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const filtered = mavericks.filter(
    (m) =>
      !q.trim() ||
      m.name.toLowerCase().includes(q.toLowerCase()) ||
      m.email.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="relative" ref={ref}>
      <label className="mb-1.5 block text-sm font-medium text-slate-300">Recipient (Maverick)</label>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'flex h-12 w-full items-center justify-between rounded-xl border bg-white/[0.03] px-4 text-left text-sm transition-all hover:border-white/20',
          open ? 'border-electric-400/50 ring-2 ring-electric-400/30' : 'border-white/10'
        )}
      >
        {selectedM ? (
          <span className="flex min-w-0 flex-1 items-center gap-2.5">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-electric-gradient text-[10px] font-bold text-white">
              {selectedM.name.split(' ').map((n) => n[0]).join('')}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-white">{selectedM.name}</span>
              <span className="block truncate text-xs text-slate-500">{selectedM.email}</span>
            </span>
          </span>
        ) : (
          <span className="text-slate-500">Select a Maverick…</span>
        )}
        <Plus className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-45')} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-xl border border-white/10 bg-ink-900 shadow-2xl shadow-black/60">
          <div className="border-b border-white/10 p-2">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name or email…"
              className="h-9 w-full rounded-lg border border-white/10 bg-white/[0.03] px-3 text-sm text-white placeholder:text-slate-500 focus:border-electric-400/50 focus:outline-none"
            />
          </div>
          <div className="max-h-64 overflow-auto p-1.5">
            {mavericks.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-slate-500">No Mavericks registered yet.</p>
            ) : filtered.length === 0 ? (
              <p className="px-3 py-4 text-center text-sm text-slate-500">No matches.</p>
            ) : (
              filtered.map((m) => {
                const isSelected = m.id === selected;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { onSelect(m); setOpen(false); setQ(''); }}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors',
                      isSelected ? 'bg-electric-500/15' : 'hover:bg-white/5'
                    )}
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-electric-gradient text-[11px] font-bold text-white">
                      {m.name.split(' ').map((n) => n[0]).join('')}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-white">{m.name}</span>
                      <span className="block truncate text-xs text-slate-500">{m.email} · {m.department}</span>
                    </span>
                    {isSelected && <Check className="h-4 w-4 shrink-0 text-electric-300" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
