import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Frosted glass panel with optional glow border and hover lift.
 * The base building block for nearly every surface in the app.
 */
export default function GlassCard({
  children,
  className = '',
  glow = false,
  hover = false,
  strong = false,
  as: Tag = 'div',
  ...props
}) {
  const MotionTag = useMemo(() => motion(Tag), [Tag]);
  return (
    <MotionTag
      className={cn(
        strong ? 'glass-strong' : 'glass',
        glow && 'glow-border',
        'rounded-2xl',
        hover && 'transition-shadow hover:shadow-glow',
        className
      )}
      {...(hover
        ? {
            whileHover: { y: -4 },
            transition: { type: 'spring', stiffness: 300, damping: 24 },
          }
        : {})}
      {...props}
    >
      {children}
    </MotionTag>
  );
}
