import { motion } from 'framer-motion';

/**
 * Standard page heading with eyebrow, title, description and action slot.
 */
export default function PageHeader({ eyebrow, title, description, actions, icon: Icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        {eyebrow && (
          <p className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-electric-300">
            {Icon && <Icon className="h-3.5 w-3.5" />}
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-2xl font-bold text-white md:text-3xl">{title}</h1>
        {description && <p className="mt-1.5 max-w-2xl text-sm text-slate-400">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </motion.div>
  );
}
