import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { seededRandom } from '@/lib/utils';

/**
 * Lightweight floating particle field rendered with motion divs.
 * Deterministic positions (seeded) so they don't reshuffle on re-render.
 */
export default function Particles({ count = 26, className = '' }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => {
        const seed = `p-${i}`;
        return {
          id: i,
          x: seededRandom(seed + 'x') * 100,
          y: seededRandom(seed + 'y') * 100,
          size: 1 + seededRandom(seed + 's') * 3,
          duration: 6 + seededRandom(seed + 'd') * 12,
          delay: seededRandom(seed + 'l') * 6,
          drift: -20 + seededRandom(seed + 'r') * 40,
        };
      }),
    [count]
  );

  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-cyanglow-400"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            boxShadow: '0 0 8px rgba(52,227,255,0.8)',
          }}
          animate={{ y: [0, -40, 0], x: [0, p.drift, 0], opacity: [0, 0.9, 0] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
