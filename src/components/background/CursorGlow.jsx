import { motion } from 'framer-motion';
import useMousePosition from '@/hooks/useMousePosition';

/**
 * A soft glow that follows the cursor, adding cursor-reactive lighting.
 * Disabled on touch devices implicitly (no mousemove events).
 */
export default function CursorGlow() {
  const { x, y } = useMousePosition();

  return (
    <motion.div
      className="pointer-events-none fixed -z-[5] h-72 w-72 rounded-full blur-[80px]"
      style={{ background: 'radial-gradient(circle, rgba(47,128,255,0.18), transparent 70%)' }}
      animate={{ x: x - 144, y: y - 144 }}
      transition={{ type: 'spring', stiffness: 60, damping: 20, mass: 0.6 }}
    />
  );
}
