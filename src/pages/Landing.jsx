import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck, Sparkles, ScanLine, ShieldAlert, ArrowRight, Award,
  Zap, Building2, TrendingUp, CheckCircle2, Brain, Lock, Globe,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import GlassCard from '@/components/ui/GlassCard';
import Particles from '@/components/background/Particles';
import CertificatePreview from '@/components/certificate/CertificatePreview';
import useCountUp from '@/hooks/useCountUp';
import { SEED_CERTIFICATES } from '@/data/mockData';

const FEATURES = [
  { icon: Sparkles, title: 'AI Certificate Generator', desc: 'Generate personalised, narrative-rich certificates in seconds with AI-crafted achievement summaries.', tone: 'electric' },
  { icon: ShieldCheck, title: 'Ledger Verification', desc: 'Every credential is hashed and recorded — instantly verifiable by managers, clients and recruiters.', tone: 'cyan' },
  { icon: ShieldAlert, title: 'AI Fraud Detection', desc: 'Layout, font, metadata and QR forensics score every document for tamper risk in real time.', tone: 'violet' },
  { icon: ScanLine, title: 'QR Verify Portal', desc: 'A public, trustworthy portal to validate any certificate by ID, QR scan or file upload.', tone: 'electric' },
  { icon: Brain, title: 'Smart Design Engine', desc: 'AI recommends premium templates and branding tuned to each department and skill profile.', tone: 'cyan' },
  { icon: TrendingUp, title: 'Executive Analytics', desc: 'Issuance trends, department insights and fraud metrics in a cinematic command center.', tone: 'violet' },
];

const STEPS = [
  { n: '01', title: 'Input achievement', desc: 'HR/L&D enters the learner, course, score and skills — or bulk-uploads a cohort.' },
  { n: '02', title: 'AI generates', desc: 'The engine writes the narrative, picks a template and mints a verifiable credential.' },
  { n: '03', title: 'Verify anywhere', desc: 'Recipients share a QR; anyone can confirm authenticity in seconds, fraud-checked.' },
];

const TONE_MAP = {
  electric: 'text-electric-300 bg-electric-500/15 border-electric-400/30',
  cyan: 'text-cyanglow-300 bg-cyanglow-500/15 border-cyanglow-400/30',
  violet: 'text-violetglow-300 bg-violetglow-500/15 border-violetglow-400/30',
};

function Stat({ value, suffix, label }) {
  const n = useCountUp(value, { duration: 2000 });
  return (
    <div className="text-center">
      <p className="font-display text-3xl font-bold text-gradient md:text-4xl">
        {Math.round(n).toLocaleString()}
        {suffix}
      </p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </div>
  );
}

function TopNav() {
  return (
    <header className="fixed inset-x-0 top-0 z-40">
      <div className="mx-auto mt-4 flex max-w-6xl items-center justify-between rounded-2xl border border-white/10 bg-ink-900/60 px-5 py-3 backdrop-blur-xl">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-electric-gradient">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <span className="font-display font-bold text-white">Mavericks Certify</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#how" className="hover:text-white">How it works</a>
          <Link to="/app/verify" className="hover:text-white">Verify</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/login"><Button variant="ghost" size="sm">Sign in</Button></Link>
          <Link to="/signup"><Button size="sm" iconRight={ArrowRight}>Get started</Button></Link>
        </div>
      </div>
    </header>
  );
}

export default function Landing() {
  return (
    <div className="relative">
      <TopNav />

      {/* HERO */}
      <section className="relative flex min-h-screen items-center overflow-hidden px-6 pt-28">
        <Particles count={28} />
        {/* Glowing AI sphere */}
        <motion.div
          className="absolute right-[8%] top-1/2 hidden h-80 w-80 -translate-y-1/2 lg:block"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2 }}
        >
          <div className="absolute inset-0 animate-pulse-glow rounded-full bg-electric-gradient blur-2xl opacity-60" />
          <div className="absolute inset-6 rounded-full border border-white/20 bg-ink-800/40 backdrop-blur-sm" />
          <motion.div
            className="absolute inset-0 rounded-full border border-cyanglow-400/30"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Brain className="h-24 w-24 text-white/80" />
          </div>
        </motion.div>

        <div className="relative z-10 mx-auto w-full max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-electric-400/30 bg-electric-500/10 px-3.5 py-1.5 text-xs font-medium text-electric-200">
              <Zap className="h-3.5 w-3.5" /> AI-Native Credential Platform · Hexaware Mavericks
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] text-white md:text-6xl">
              AI-Powered <span className="text-gradient-electric">Certification Intelligence</span> for Mavericks
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-300">
              Automate recognition. Eliminate fraud. Verify instantly. The complete certificate
              lifecycle — generated, personalised and authenticated by AI.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/signup"><Button size="lg" iconRight={ArrowRight}>Launch the platform</Button></Link>
              <Link to="/app/verify"><Button size="lg" variant="secondary" icon={ScanLine}>Verify a certificate</Button></Link>
            </div>
            <div className="mt-8 flex items-center gap-5 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> No setup</span>
              <span className="flex items-center gap-1.5"><Lock className="h-4 w-4 text-electric-400" /> Tamper-proof</span>
              <span className="flex items-center gap-1.5"><Globe className="h-4 w-4 text-cyanglow-400" /> Verify anywhere</span>
            </div>
          </motion.div>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-ink-900 to-transparent" />
      </section>

      {/* FLOATING CERTIFICATES STRIP */}
      <section className="relative mx-auto mt-12 max-w-6xl px-6">
        <div className="grid gap-6 md:grid-cols-3">
          {SEED_CERTIFICATES.slice(0, 3).map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.12 }}
              animate={{ y: [0, -10, 0] }}
              style={{ animationDelay: `${i * 0.5}s` }}
            >
              <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut' }}>
                <CertificatePreview cert={c} compact />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* STATS */}
      <section className="relative mx-auto mt-24 max-w-5xl px-6">
        <GlassCard className="grid grid-cols-2 gap-8 p-8 md:grid-cols-4">
          <Stat value={4820} suffix="+" label="Certificates issued" />
          <Stat value={18} suffix="s" label="Avg. generation time" />
          <Stat value={99} suffix="%" label="Verification accuracy" />
          <Stat value={37} suffix="" label="Fraud attempts blocked" />
        </GlassCard>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative mx-auto mt-28 max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold text-white">One platform, the entire lifecycle</h2>
          <p className="mt-4 text-slate-400">
            From AI generation to fraud-proof verification — Mavericks Certify replaces days of manual
            HR work with an intelligent, cinematic experience.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.1 }}
            >
              <GlassCard hover glow className="h-full p-6">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border ${TONE_MAP[f.tone]}`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-lg font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="relative mx-auto mt-28 max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold text-white">Three steps to recognition</h2>
          <p className="mt-4 text-slate-400">What once took multiple days now takes seconds.</p>
        </div>
        <div className="relative mt-14 grid gap-8 md:grid-cols-3">
          <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-electric-400/40 to-transparent md:block" />
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="relative text-center"
            >
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-electric-gradient font-display text-2xl font-bold text-white shadow-glow">
                {s.n}
              </div>
              <h3 className="mt-5 font-display text-xl font-semibold text-white">{s.title}</h3>
              <p className="mx-auto mt-2 max-w-xs text-sm text-slate-400">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto mt-28 max-w-5xl px-6 pb-28">
        <GlassCard glow strong className="relative overflow-hidden p-12 text-center">
          <div className="absolute inset-0 bg-electric-gradient opacity-10" />
          <Particles count={16} />
          <div className="relative">
            <Award className="mx-auto h-12 w-12 text-electric-300" />
            <h2 className="mt-5 font-display text-4xl font-bold text-white">
              Ready to modernise recognition?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-slate-300">
              Join the Hexaware Mavericks credential ecosystem and turn certification into a
              competitive advantage.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/signup"><Button size="lg" iconRight={ArrowRight}>Get started free</Button></Link>
              <Link to="/login"><Button size="lg" variant="secondary" icon={Building2}>Enterprise sign in</Button></Link>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/10 px-6 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-electric-gradient">
              <ShieldCheck className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-sm text-slate-400">© 2026 Hexaware Technologies · Mavericks Certify</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-400">
            <a href="#features" className="hover:text-white">Features</a>
            <Link to="/app/verify" className="hover:text-white">Verify</Link>
            <Link to="/login" className="hover:text-white">Sign in</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
