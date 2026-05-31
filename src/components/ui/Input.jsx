import { forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

const Input = forwardRef(function Input(
  { label, icon: Icon, type = 'text', error, hint, className = '', containerClass = '', ...props },
  ref
) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (show ? 'text' : 'password') : type;

  return (
    <div className={cn('w-full', containerClass)}>
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <div className="group relative">
        {Icon && (
          <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-electric-300" />
        )}
        <input
          ref={ref}
          type={inputType}
          className={cn(
            'h-12 w-full rounded-xl border bg-white/[0.03] text-sm text-white placeholder:text-slate-500',
            'transition-all duration-300 focus:outline-none focus:bg-white/[0.06]',
            'focus:ring-2 focus:ring-electric-400/40 focus:border-electric-400/50',
            Icon ? 'pl-11 pr-4' : 'px-4',
            isPassword && 'pr-11',
            error ? 'border-rose-500/60' : 'border-white/10 hover:border-white/20',
            className
          )}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-white/5 hover:text-electric-300"
            tabIndex={-1}
            aria-label={show ? 'Hide password' : 'Show password'}
          >
            {show ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
          </button>
        )}
      </div>
      {error ? (
        <p className="mt-1.5 text-xs text-rose-400">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
});

export default Input;
