import { motion } from 'framer-motion';
import { useThemeStore, THEMES } from '@/store/themeStore';

/**
 * Full-screen animated gradient background with floating glowing orbs,
 * concentric rings and a faint grid — the cinematic base layer for the app.
 * Render once near the root; it sits behind everything (z-index 0).
 */
export default function AnimatedBackground({ variant = 'default' }) {
  const theme = useThemeStore((s) => s.theme);
  const mode = useThemeStore((s) => s.mode);
  const themeDef = THEMES[theme] || THEMES.midnight;
  const isLight = mode === 'light';
  const orbs = isLight ? themeDef.lightOrbs : themeDef.orbs;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-ink-900">
      {/* Base radial wash */}
      <div className="absolute inset-0 bg-radial-glow" style={{ opacity: isLight ? 0.35 : 0.8 }} />

      {/* Faint grid */}
      <div
        className="absolute inset-0 bg-grid-faint"
        style={{
          backgroundSize: '54px 54px',
          opacity: isLight ? 0.18 : 0.35,
          maskImage: 'radial-gradient(circle at 50% 30%, black, transparent 75%)',
        }}
      />

      {/* Floating glowing orbs — colors driven by active theme */}
      <motion.div
        className="absolute -top-40 -left-32 h-[34rem] w-[34rem] rounded-full blur-[120px] transition-[background] duration-700"
        style={{ background: orbs[0] }}
        animate={{ x: [0, 60, 0], y: [0, 40, 0], scale: [1, 1.15, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-1/3 -right-40 h-[30rem] w-[30rem] rounded-full blur-[130px] transition-[background] duration-700"
        style={{ background: orbs[1] }}
        animate={{ x: [0, -50, 0], y: [0, 60, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-12rem] left-1/4 h-[32rem] w-[32rem] rounded-full blur-[140px] transition-[background] duration-700"
        style={{ background: orbs[2] }}
        animate={{ x: [0, 40, 0], y: [0, -40, 0], scale: [1, 1.1, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Concentric holographic rings */}
      {variant !== 'minimal' && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
          {[0, 1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border border-electric-400/10"
              style={{
                width: `${(i + 1) * 22}rem`,
                height: `${(i + 1) * 22}rem`,
                left: `${-(i + 1) * 11}rem`,
                top: `${-(i + 1) * 11}rem`,
              }}
              animate={{ rotate: i % 2 === 0 ? 360 : -360, opacity: [0.15, 0.4, 0.15] }}
              transition={{
                rotate: { duration: 40 + i * 12, repeat: Infinity, ease: 'linear' },
                opacity: { duration: 8, repeat: Infinity, ease: 'easeInOut' },
              }}
            />
          ))}
        </div>
      )}

      {/* Vignette for depth — soft in light mode, deep in dark */}
      <div
        className="absolute inset-0"
        style={{
          background: isLight
            ? 'radial-gradient(circle at 50% 50%, transparent 50%, rgba(15,23,42,0.08) 100%)'
            : 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(5,6,15,0.85) 100%)',
        }}
      />
    </div>
  );
}
