import { useEffect, useLayoutEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Sparkles, LayoutDashboard, UploadCloud, History, Award, ScanLine,
  Trophy, Settings as SettingsIcon, ArrowRight, ArrowLeft, X, Rocket,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

/**
 * First-login onboarding tour for new Maverick accounts.
 * Each step anchors a small popup next to the relevant sidebar item with an
 * arrow pointer and a spotlight cutout. The first/welcome step is centered
 * because it has no target. Skipping or finishing marks it done in localStorage.
 */
const STEPS = [
  {
    icon: Sparkles,
    title: 'Welcome to Mavericks Certify',
    body: "Your AI-powered credential platform. A 30-second tour of the things that matter — I'll point each one out.",
    accent: 'electric',
  },
  {
    icon: LayoutDashboard,
    title: 'My Overview',
    body: 'Your home base — certificates earned, leaderboard rank, learning streak and recent recognition. Glanceable in one screen.',
    accent: 'electric',
    target: '/app/overview',
  },
  {
    icon: UploadCloud,
    title: 'Submit a Certificate',
    body: 'Earned an external credential like AWS or Coursera? Submit it here with proof documents — admins review and approve before it joins your verified profile.',
    hint: "Internal Hexaware certificates are assigned automatically — you don't submit those.",
    accent: 'cyan',
    target: '/app/submit',
  },
  {
    icon: History,
    title: 'My Submissions',
    body: 'Track every credential you submitted — Pending, Approved, or Rejected with admin feedback so you know what to fix and resubmit.',
    accent: 'cyan',
    target: '/app/submissions',
  },
  {
    icon: Award,
    title: 'My Certificates',
    body: 'Every credential you own — searchable, viewable as PDF, downloadable, and verifiable by recruiters via QR.',
    hint: 'Click "View PDF" inside any certificate to open it in a new tab.',
    accent: 'violet',
    target: '/app/certificates',
  },
  {
    icon: ScanLine,
    title: 'Verify Portal',
    body: 'Verify any Mavericks certificate by ID or upload — confidence score, fraud signals and ledger checks in under a second.',
    accent: 'violet',
    target: '/app/verify',
  },
  {
    icon: Trophy,
    title: 'Leaderboard',
    body: 'See where you rank across all Mavericks. Build a learning streak, chase the podium, earn recruiter-visible recognition.',
    accent: 'warning',
    target: '/app/leaderboard',
  },
  {
    icon: SettingsIcon,
    title: 'Settings — make it yours',
    body: 'Change your password, switch light/dark mode, pick an ambient palette and tune notifications.',
    hint: 'Quick light/dark toggle: the sun/moon icon in the top bar.',
    accent: 'success',
    target: '/app/settings',
  },
];

const ACCENT_BG = {
  electric: 'bg-electric-500/15 text-electric-200',
  cyan: 'bg-cyanglow-500/15 text-cyanglow-300',
  violet: 'bg-violetglow-500/15 text-violetglow-300',
  success: 'bg-emerald-500/15 text-emerald-300',
  warning: 'bg-amber-500/15 text-amber-300',
};

const ACCENT_DOT = {
  electric: 'bg-electric-400',
  cyan: 'bg-cyanglow-400',
  violet: 'bg-violetglow-400',
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
};

const CARD_WIDTH = 380;
const CARD_GAP = 18; // gap between target and card
const ARROW_SIZE = 12;

function computeLayout(rect) {
  if (!rect) return null;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  // Prefer right placement; fall back to left if there isn't room
  const fitsRight = rect.right + CARD_GAP + CARD_WIDTH + 16 <= vw;
  const side = fitsRight ? 'right' : 'left';

  // Use an estimated card height for vertical alignment; the card auto-sizes
  // but ~280-340px is the typical range — we let CSS handle the overflow.
  const ESTIMATED_HEIGHT = 320;
  let top = rect.top + rect.height / 2 - ESTIMATED_HEIGHT / 2;
  top = Math.max(16, Math.min(vh - ESTIMATED_HEIGHT - 16, top));

  const left = side === 'right'
    ? rect.right + CARD_GAP
    : rect.left - CARD_GAP - CARD_WIDTH;

  const arrowY = rect.top + rect.height / 2 - top;
  return { side, left, top, arrowY };
}

export default function OnboardingTour({ open, onClose }) {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const [layout, setLayout] = useState(null);

  useEffect(() => {
    if (open) setStep(0);
  }, [open]);

  // Recompute the target rect whenever the step changes, and on resize/scroll.
  useLayoutEffect(() => {
    if (!open) return;
    const { target } = STEPS[step] || {};
    if (!target) {
      setTargetRect(null);
      setLayout(null);
      return;
    }
    const measure = () => {
      const el = document.querySelector(`[data-tour="${target}"]`);
      if (!el) {
        setTargetRect(null);
        setLayout(null);
        return;
      }
      const r = el.getBoundingClientRect();
      setTargetRect({ top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height });
      setLayout(computeLayout(r));
    };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, step]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e) => {
      if (!open) return;
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowRight') setStep((s) => Math.min(STEPS.length - 1, s + 1));
      if (e.key === 'ArrowLeft') setStep((s) => Math.max(0, s - 1));
    };
    if (open) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;
  // Center if there's no target OR if the target couldn't be measured (e.g. on mobile)
  const isCentered = !current.target || !layout;

  const next = () => {
    if (isLast) {
      onClose?.();
      navigate('/app/overview');
    } else {
      setStep((s) => s + 1);
    }
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const card = (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      >
        {/* Top accent line */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-electric-400/60 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-electric-300">
            Getting started · {step + 1} / {STEPS.length}
          </span>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Skip tour"
          >
            Skip <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className={cn('mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl', ACCENT_BG[current.accent])}>
            <current.icon className="h-6 w-6" />
          </div>
          <h2 className="font-display text-xl font-bold text-white">{current.title}</h2>
          <p className="mt-2.5 text-sm leading-relaxed text-slate-300">{current.body}</p>
          {current.hint && (
            <div className="mt-3 flex items-start gap-2 rounded-xl border border-electric-400/20 bg-electric-500/10 p-2.5 text-xs text-electric-200">
              <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{current.hint}</span>
            </div>
          )}
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pb-3">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`Go to step ${i + 1}`}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === step ? cn('w-6', ACCENT_DOT[current.accent]) : 'w-1.5 bg-white/15 hover:bg-white/30'
              )}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowLeft}
            disabled={isFirst}
            onClick={back}
            className={isFirst ? 'invisible' : ''}
          >
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>
              Skip
            </Button>
            <Button size="sm" iconRight={isLast ? Rocket : ArrowRight} onClick={next}>
              {isLast ? 'Get started' : 'Next'}
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop — dim everything but the spotlight */}
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />

      {/* Spotlight ring around the target */}
      {targetRect && !isCentered && (
        <motion.div
          className="pointer-events-none absolute rounded-xl"
          initial={false}
          animate={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
          transition={{ type: 'spring', stiffness: 240, damping: 26 }}
          style={{
            boxShadow:
              '0 0 0 9999px rgba(5,6,15,0.55), 0 0 24px rgba(47,128,255,0.55), inset 0 0 0 2px rgba(47,128,255,0.85)',
          }}
        />
      )}

      {/* Anchored card */}
      {!isCentered && (
        <motion.div
          className="glass-strong absolute overflow-hidden rounded-2xl shadow-2xl"
          style={{ left: layout.left, top: layout.top, width: CARD_WIDTH }}
          initial={false}
          animate={{ left: layout.left, top: layout.top }}
          transition={{ type: 'spring', stiffness: 240, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Arrow pointer toward the target */}
          <span
            aria-hidden="true"
            className="absolute"
            style={{
              top: Math.max(16, Math.min(280, (layout.arrowY ?? 0) - ARROW_SIZE)),
              [layout.side === 'right' ? 'left' : 'right']: -ARROW_SIZE,
              width: 0,
              height: 0,
              borderTop: `${ARROW_SIZE}px solid transparent`,
              borderBottom: `${ARROW_SIZE}px solid transparent`,
              [layout.side === 'right' ? 'borderRight' : 'borderLeft']: `${ARROW_SIZE}px solid rgba(255,255,255,0.12)`,
            }}
          />
          {card}
        </motion.div>
      )}

      {/* Centered fallback (welcome step or mobile / unknown target) */}
      {isCentered && (
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <motion.div
            className="glass-strong relative w-full max-w-md overflow-hidden rounded-2xl"
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
          >
            {card}
          </motion.div>
        </div>
      )}
    </div>
  );
}
