import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud, Building2, GraduationCap, FileText, Image as ImageIcon, X, Plus,
  Send, CalendarDays, Gauge, Award, Sparkles, Paperclip,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Badge from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/store/toastStore';
import { createSubmission } from '@/services/submissionService';
import { COURSES, SKILL_BANK } from '@/data/mockData';
import { cn } from '@/lib/utils';

const MAX_DOC_BYTES = 6 * 1024 * 1024; // 6 MB cap per file
const INLINE_PREVIEW_BYTES = 1.5 * 1024 * 1024; // store data URL for small images only

function readFile(file) {
  return new Promise((resolve) => {
    const meta = { name: file.name, size: file.size, type: file.type, dataUrl: null };
    if (file.type.startsWith('image/') && file.size <= INLINE_PREVIEW_BYTES) {
      const reader = new FileReader();
      reader.onload = () => resolve({ ...meta, dataUrl: reader.result });
      reader.onerror = () => resolve(meta);
      reader.readAsDataURL(file);
    } else {
      resolve(meta);
    }
  });
}

function prettySize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const TABS = [
  { id: 'internal', label: 'Internal certificate', icon: GraduationCap, hint: 'Hexaware assessment / course' },
  { id: 'external', label: 'External certificate', icon: Building2, hint: 'Third-party credential + proof' },
];

export default function SubmitCertificate() {
  const user = useAuthStore((s) => s.user);
  const toast = useToast();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [type, setType] = useState('internal');
  const [form, setForm] = useState({
    certificateName: '',
    issuingOrg: '',
    score: '',
    completionDate: '',
    remarks: '',
  });
  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [docs, setDocs] = useState([]);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const addSkill = (raw) => {
    const v = (raw ?? skillInput).trim();
    if (v && !skills.includes(v)) setSkills((s) => [...s, v]);
    setSkillInput('');
  };
  const removeSkill = (s) => setSkills((arr) => arr.filter((x) => x !== s));

  const onFiles = async (fileList) => {
    const incoming = Array.from(fileList);
    const accepted = [];
    for (const file of incoming) {
      const ok = /pdf|image\//.test(file.type) || /\.(pdf|png|jpe?g|webp)$/i.test(file.name);
      if (!ok) {
        toast.warning(`${file.name} is not a PDF or image`);
        continue;
      }
      if (file.size > MAX_DOC_BYTES) {
        toast.warning(`${file.name} exceeds the 6 MB limit`);
        continue;
      }
      accepted.push(await readFile(file));
    }
    if (accepted.length) {
      setDocs((d) => [...d, ...accepted]);
      setErrors((e) => ({ ...e, documents: undefined }));
    }
  };

  const removeDoc = (name) => setDocs((d) => d.filter((x) => x.name !== name));

  const validate = () => {
    const e = {};
    if (!form.certificateName.trim()) e.certificateName = 'Certificate name is required';
    if (!form.completionDate) e.completionDate = 'Completion date is required';
    if (form.score === '' || isNaN(Number(form.score))) e.score = 'Enter a valid score';
    if (type === 'external') {
      if (!form.issuingOrg.trim()) e.issuingOrg = 'Issuing organization is required';
      if (docs.length === 0) e.documents = 'Upload at least one proof document';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) {
      toast.warning('Please fix the highlighted fields');
      return;
    }
    setSubmitting(true);
    try {
      await createSubmission({
        type,
        submittedById: user.id,
        submittedByName: user.name,
        submittedByEmail: user.email,
        department: user.department,
        certificateName: form.certificateName.trim(),
        issuingOrg: type === 'external' ? form.issuingOrg.trim() : 'Hexaware Mavericks Academy',
        score: Number(form.score),
        completionDate: form.completionDate,
        remarks: form.remarks.trim(),
        skills,
        documents: docs,
      });
      toast.success('Submitted for admin review');
      navigate('/app/submissions');
    } catch (_) {
      toast.error('Could not submit — please try again');
    } finally {
      setSubmitting(false);
    }
  };

  const textareaCls =
    'w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white placeholder:text-slate-500 transition-all focus:outline-none focus:bg-white/[0.06] focus:ring-2 focus:ring-electric-400/40 focus:border-electric-400/50 hover:border-white/20';

  return (
    <div>
      <PageHeader
        eyebrow="Workflow"
        icon={UploadCloud}
        title="Submit a certificate"
        description="Request recognition for an internal assessment or upload an external credential. Your submission is reviewed by an admin before it joins your profile."
      />

      {/* Type tabs */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {TABS.map((t) => {
          const active = type === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.id)}
              className={cn(
                'flex items-center gap-3 rounded-2xl border p-4 text-left transition-all',
                active
                  ? 'border-electric-400/50 bg-electric-500/10 shadow-glow-sm'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/20'
              )}
            >
              <div
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
                  active ? 'bg-electric-gradient text-white shadow-glow-sm' : 'bg-white/5 text-slate-300'
                )}
              >
                <t.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium text-white">{t.label}</p>
                <p className="text-xs text-slate-400">{t.hint}</p>
              </div>
              {active && <div className="ml-auto h-2.5 w-2.5 rounded-full bg-electric-400 shadow-[0_0_10px_currentColor]" />}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <GlassCard className="p-6 lg:col-span-2">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                label="Certificate name"
                icon={Award}
                list={type === 'internal' ? 'course-list' : undefined}
                placeholder={type === 'internal' ? 'e.g. Cloud Foundations on AWS' : 'e.g. AWS Certified Solutions Architect'}
                value={form.certificateName}
                onChange={(e) => set('certificateName', e.target.value)}
                error={errors.certificateName}
              />
              {type === 'internal' && (
                <datalist id="course-list">
                  {COURSES.map((c) => <option key={c} value={c} />)}
                </datalist>
              )}
            </div>

            {type === 'external' && (
              <Input
                label="Issuing organization"
                icon={Building2}
                placeholder="e.g. Amazon Web Services"
                value={form.issuingOrg}
                onChange={(e) => set('issuingOrg', e.target.value)}
                error={errors.issuingOrg}
                containerClass="sm:col-span-2"
              />
            )}

            <Input
              label={type === 'internal' ? 'Assessment score (%)' : 'Exam / assessment score'}
              icon={Gauge}
              type="number"
              placeholder={type === 'internal' ? '0–100' : 'e.g. 870'}
              value={form.score}
              onChange={(e) => set('score', e.target.value)}
              error={errors.score}
              hint={type === 'external' ? 'Use the scale on your certificate' : undefined}
            />

            <Input
              label="Completion date"
              icon={CalendarDays}
              type="date"
              value={form.completionDate}
              onChange={(e) => set('completionDate', e.target.value)}
              error={errors.completionDate}
            />

            {/* Skills */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Skills demonstrated <span className="text-slate-500">(optional)</span></label>
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {skills.map((s) => (
                    <motion.span
                      key={s}
                      layout
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                    >
                      <Badge tone="violet" className="pr-1.5">
                        {s}
                        <button type="button" onClick={() => removeSkill(s)} className="ml-1 rounded-full p-0.5 hover:bg-white/10">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
              <div className="mt-2 flex gap-2">
                <Input
                  list="skill-list"
                  placeholder="Add a skill and press Enter"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); addSkill(); }
                  }}
                />
                <datalist id="skill-list">
                  {SKILL_BANK.map((s) => <option key={s} value={s} />)}
                </datalist>
                <Button type="button" variant="secondary" icon={Plus} onClick={() => addSkill()}>Add</Button>
              </div>
            </div>

            {/* Remarks */}
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-slate-300">Remarks <span className="text-slate-500">(optional)</span></label>
              <textarea
                rows={3}
                className={textareaCls}
                placeholder="Anything the reviewer should know…"
                value={form.remarks}
                onChange={(e) => set('remarks', e.target.value)}
              />
            </div>

            {/* External upload */}
            {type === 'external' && (
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-medium text-slate-300">Proof documents <span className="text-rose-400">*</span></label>
                <div
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); onFiles(e.dataTransfer.files); }}
                  className={cn(
                    'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors',
                    errors.documents ? 'border-rose-500/50 bg-rose-500/5' : 'border-white/15 hover:border-electric-400/50 hover:bg-electric-500/5'
                  )}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-electric-500/15">
                    <UploadCloud className="h-6 w-6 text-electric-300" />
                  </div>
                  <p className="text-sm font-medium text-white">Click to upload or drag & drop</p>
                  <p className="text-xs text-slate-500">PDF, PNG or JPG · up to 6 MB each</p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => { onFiles(e.target.files); e.target.value = ''; }}
                  />
                </div>
                {errors.documents && <p className="mt-1.5 text-xs text-rose-400">{errors.documents}</p>}

                <div className="mt-3 space-y-2">
                  <AnimatePresence>
                    {docs.map((d) => (
                      <motion.div
                        key={d.name}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5">
                          {d.type.startsWith('image/')
                            ? <ImageIcon className="h-4.5 w-4.5 text-cyanglow-300" />
                            : <FileText className="h-4.5 w-4.5 text-electric-300" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm text-white">{d.name}</p>
                          <p className="text-xs text-slate-500">{prettySize(d.size)}</p>
                        </div>
                        <button type="button" onClick={() => removeDoc(d.name)} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-rose-300">
                          <X className="h-4 w-4" />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-white/10 pt-5">
            <Button variant="ghost" onClick={() => navigate('/app/submissions')}>Cancel</Button>
            <Button icon={Send} loading={submitting} onClick={submit}>Submit for review</Button>
          </div>
        </GlassCard>

        {/* Side: live summary + guidance */}
        <div className="space-y-6">
          <GlassCard glow strong className="p-5">
            <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-electric-300">
              <Sparkles className="h-3.5 w-3.5" /> Submission preview
            </p>
            <div className="space-y-3 text-sm">
              <Row label="Type" value={<Badge tone={type === 'external' ? 'cyan' : 'electric'}>{type === 'external' ? 'External' : 'Internal'}</Badge>} />
              <Row label="Maverick" value={user.name} />
              <Row label="Department" value={user.department} />
              <Row label="Certificate" value={form.certificateName || '—'} />
              {type === 'external' && <Row label="Issuer" value={form.issuingOrg || '—'} />}
              <Row label="Score" value={form.score !== '' ? `${form.score}${type === 'internal' ? '%' : ''}` : '—'} />
              <Row label="Completed" value={form.completionDate || '—'} />
              {type === 'external' && (
                <Row label="Documents" value={<span className="flex items-center gap-1.5"><Paperclip className="h-3.5 w-3.5" />{docs.length}</span>} />
              )}
            </div>
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="mb-2 font-semibold text-white">What happens next?</h3>
            <ol className="space-y-2.5 text-sm text-slate-400">
              {['Submission enters the admin Pending Approvals queue', 'An admin reviews details, score & documents', 'On approval, a verifiable certificate is issued to your profile', 'You can track status anytime under My Submissions'].map((step, i) => (
                <li key={i} className="flex gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-electric-500/15 text-[11px] font-bold text-electric-200">{i + 1}</span>
                  {step}
                </li>
              ))}
            </ol>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2 last:border-0 last:pb-0">
      <span className="text-slate-500">{label}</span>
      <span className="truncate text-right font-medium text-white">{value}</span>
    </div>
  );
}
