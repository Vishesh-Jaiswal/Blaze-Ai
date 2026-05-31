import { create } from 'zustand';

const THEME_KEY = 'mc.theme';
const MODE_KEY = 'mc.mode';

export const THEMES = {
  midnight: {
    name: 'Midnight',
    gradient: 'linear-gradient(135deg,#05060f,#10142e)',
    orbs: [
      'radial-gradient(circle, rgba(47,128,255,0.55), transparent 70%)',
      'radial-gradient(circle, rgba(6,200,255,0.45), transparent 70%)',
      'radial-gradient(circle, rgba(139,92,246,0.4), transparent 70%)',
    ],
    lightOrbs: [
      'radial-gradient(circle, rgba(47,128,255,0.22), transparent 70%)',
      'radial-gradient(circle, rgba(6,200,255,0.18), transparent 70%)',
      'radial-gradient(circle, rgba(139,92,246,0.16), transparent 70%)',
    ],
  },
  electric: {
    name: 'Electric',
    gradient: 'linear-gradient(135deg,#0b3fa3,#06c8ff)',
    orbs: [
      'radial-gradient(circle, rgba(6,200,255,0.7), transparent 70%)',
      'radial-gradient(circle, rgba(47,128,255,0.6), transparent 70%)',
      'radial-gradient(circle, rgba(52,227,255,0.45), transparent 70%)',
    ],
    lightOrbs: [
      'radial-gradient(circle, rgba(6,200,255,0.26), transparent 70%)',
      'radial-gradient(circle, rgba(47,128,255,0.2), transparent 70%)',
      'radial-gradient(circle, rgba(52,227,255,0.18), transparent 70%)',
    ],
  },
  quantum: {
    name: 'Quantum',
    gradient: 'linear-gradient(135deg,#4c1d95,#8b5cf6)',
    orbs: [
      'radial-gradient(circle, rgba(139,92,246,0.65), transparent 70%)',
      'radial-gradient(circle, rgba(217,70,239,0.5), transparent 70%)',
      'radial-gradient(circle, rgba(76,29,149,0.6), transparent 70%)',
    ],
    lightOrbs: [
      'radial-gradient(circle, rgba(139,92,246,0.24), transparent 70%)',
      'radial-gradient(circle, rgba(217,70,239,0.18), transparent 70%)',
      'radial-gradient(circle, rgba(124,58,237,0.18), transparent 70%)',
    ],
  },
};

const initialTheme = (() => {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v && THEMES[v]) return v;
  } catch (_) {}
  return 'midnight';
})();

const initialMode = (() => {
  try {
    const v = localStorage.getItem(MODE_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch (_) {}
  return 'dark';
})();

function applyMode(mode) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('light', mode === 'light');
}

// Apply mode at module load so a refresh keeps the user's choice.
applyMode(initialMode);

export const useThemeStore = create((set, get) => ({
  theme: initialTheme,
  mode: initialMode,
  setTheme: (t) => {
    if (!THEMES[t]) return;
    try { localStorage.setItem(THEME_KEY, t); } catch (_) {}
    set({ theme: t });
  },
  setMode: (m) => {
    if (m !== 'light' && m !== 'dark') return;
    try { localStorage.setItem(MODE_KEY, m); } catch (_) {}
    applyMode(m);
    set({ mode: m });
  },
  toggleMode: () => {
    const next = get().mode === 'light' ? 'dark' : 'light';
    try { localStorage.setItem(MODE_KEY, next); } catch (_) {}
    applyMode(next);
    set({ mode: next });
  },
}));
