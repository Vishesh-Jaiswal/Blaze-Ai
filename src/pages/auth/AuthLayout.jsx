import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Sparkles, ScanLine, Award } from 'lucide-react';
import Particles from '@/components/background/Particles';

const HIGHLIGHTS = [
  { icon: Sparkles, text: 'AI-generated recognition in seconds, not days' },
  { icon: ShieldCheck, text: 'Tamper-proof, ledger-verified credentials' },
  { icon: ScanLine, text: 'Instant QR verification for clients & recruiters' },
];

/**
 * Cinematic split-screen layout shared by all auth pages.
 * Left: brand storytelling panel. Right: the form slot.
 */
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden lg:flex">
        <div className="absolute inset-0 bg-electric-gradient bg-[length:200%_200%] animate-gradient-pan opacity-90" />
        <div className="absolute inset-0 bg-ink-900/40" />
        <Particles count={30} />

        {/* Floating holographic certificate */}
        <motion.div
          className="absolute right-10 top-24 h-44 w-72 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md"
          initial={{ opacity: 0, y: 40, rotate: -8 }}
          animate={{ opacity: 1, y: 0, rotate: -8 }}
          transition={{ duration: 1, delay: 0.3 }}
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
        >
          <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 6, repeat: Infinity }} className="p-5">
            <Award className="mb-3 h-7 w-7 text-white" />
            <div className="h-2 w-32 rounded-full bg-white/40" />
            <div className="mt-2 h-2 w-24 rounded-full bg-white/25" />
            <div className="mt-5 flex items-center gap-2">
              <div className="h-8 w-8 rounded-md bg-white/30" />
              <div className="h-2 w-20 rounded-full bg-white/25" />
            </div>
          </motion.div>
        </motion.div>

        <div className="relative z-10 flex flex-col justify-between p-12">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur-md">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-white">Mavericks Certify</p>
              <p className="text-xs text-white/70">by Hexaware Technologies</p>
            </div>
          </Link>

          <div className="max-w-md">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="font-display text-4xl font-bold leading-tight text-white"
            >
              The credential intelligence platform for Mavericks.
            </motion.h2>
            <div className="mt-8 space-y-4">
              {HIGHLIGHTS.map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.12 }}
                  className="flex items-center gap-3 text-white/90"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                    <h.icon className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-sm">{h.text}</span>
                </motion.div>
              ))}
            </div>
          </div>

          <p className="text-xs text-white/60">© 2026 Hexaware Technologies · Enterprise L&D Suite</p>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-electric-gradient">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="font-display font-bold text-white">Mavericks Certify</span>
          </Link>

          <h1 className="font-display text-3xl font-bold text-white">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-slate-400">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-6 text-center text-sm text-slate-400">{footer}</div>}
        </motion.div>
      </div>
    </div>
  );
}
