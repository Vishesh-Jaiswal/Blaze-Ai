import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:
    'text-white bg-electric-gradient bg-[length:200%_100%] hover:bg-[position:100%_0] shadow-glow border border-white/10',
  secondary:
    'text-white glass-strong hover:bg-white/10 border border-white/15',
  ghost: 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent',
  outline:
    'text-electric-200 border border-electric-400/40 hover:border-electric-300 hover:bg-electric-500/10',
  danger:
    'text-white bg-gradient-to-r from-rose-500 to-red-600 shadow-[0_0_30px_rgba(244,63,94,0.4)] border border-white/10',
  success:
    'text-white bg-gradient-to-r from-emerald-500 to-teal-500 shadow-[0_0_30px_rgba(16,185,129,0.4)] border border-white/10',
};

const SIZES = {
  sm: 'h-9 px-4 text-sm rounded-lg gap-1.5',
  md: 'h-11 px-6 text-sm rounded-xl gap-2',
  lg: 'h-13 px-8 py-3.5 text-base rounded-xl gap-2.5',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  type = 'button',
  ...props
}) {
  const isDisabled = disabled || loading;
  return (
    <motion.button
      type={type}
      whileHover={isDisabled ? undefined : { scale: 1.025, y: -1 }}
      whileTap={isDisabled ? undefined : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      disabled={isDisabled}
      className={cn(
        'group relative inline-flex items-center justify-center font-medium tracking-tight transition-[background-position,colors] duration-500',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-electric-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-900',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:saturate-50',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        Icon && <Icon className="h-4 w-4 shrink-0" />
      )}
      {children}
      {IconRight && !loading && (
        <IconRight className="h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5" />
      )}
    </motion.button>
  );
}
