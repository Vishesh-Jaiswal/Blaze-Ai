import { create } from 'zustand';

let idCounter = 0;

/**
 * Global toast notifications store.
 * Usage: const toast = useToast(); toast.success('Saved!');
 */
export const useToastStore = create((set, get) => ({
  toasts: [],
  push: (toast) => {
    const id = ++idCounter;
    const entry = { id, duration: 4000, type: 'info', ...toast };
    set((s) => ({ toasts: [...s.toasts, entry] }));
    if (entry.duration > 0) {
      setTimeout(() => get().dismiss(id), entry.duration);
    }
    return id;
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

/** Convenience hook with typed helpers. */
export function useToast() {
  const push = useToastStore((s) => s.push);
  return {
    show: (message, opts) => push({ message, ...opts }),
    success: (message, opts) => push({ message, type: 'success', ...opts }),
    error: (message, opts) => push({ message, type: 'error', ...opts }),
    info: (message, opts) => push({ message, type: 'info', ...opts }),
    warning: (message, opts) => push({ message, type: 'warning', ...opts }),
  };
}
