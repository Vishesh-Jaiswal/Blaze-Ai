import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Search, Bell, Sparkles, Award, User, CornerDownLeft, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { ROLE_META, navForRole } from '@/config/roles';
import { SEED_CERTIFICATES, LEADERBOARD } from '@/data/mockData';
import { initials } from '@/lib/utils';

const NOTIFICATIONS = [
  { id: 1, text: 'New certificate verified by Acme Corp', time: '2m ago', tone: 'emerald' },
  { id: 2, text: 'Fraud attempt blocked on REQ-2026-0502', time: '1h ago', tone: 'rose' },
  { id: 3, text: '12 certificates pending your approval', time: '3h ago', tone: 'amber' },
];

export default function Topbar({ onMenu, title }) {
  const user = useAuthStore((s) => s.user);
  const meta = ROLE_META[user.role];
  const navigate = useNavigate();
  const [showNotif, setShowNotif] = useState(false);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const searchRef = useRef(null);

  // Build a searchable index scoped to what this role can reach.
  const index = useMemo(() => {
    const pages = navForRole(user.role).map((n) => ({
      type: 'Page', title: n.label, subtitle: 'Go to page', to: n.to, icon: n.icon,
    }));
    const certs = SEED_CERTIFICATES.map((c) => ({
      type: 'Certificate', title: c.course, subtitle: `${c.recipientName} · ${c.id}`,
      to: '/app/certificates', icon: Award, keywords: `${c.id} ${c.recipientName} ${c.department}`,
    }));
    const people = LEADERBOARD.map((p) => ({
      type: 'Person', title: p.name, subtitle: `${p.department} · Rank #${p.rank}`,
      to: '/app/leaderboard', icon: User,
    }));
    return [...pages, ...certs, ...people];
  }, [user.role]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return index
      .filter((item) =>
        `${item.title} ${item.subtitle} ${item.keywords || ''}`.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, index]);

  useEffect(() => { setActive(0); }, [query]);

  const go = (item) => {
    if (!item) return;
    navigate(item.to);
    setQuery('');
    setOpen(false);
    searchRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (!open || results.length === 0) {
      if (e.key === 'Escape') { setQuery(''); searchRef.current?.blur(); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => (a + 1) % results.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => (a - 1 + results.length) % results.length); }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[active]); }
    else if (e.key === 'Escape') { setOpen(false); setQuery(''); searchRef.current?.blur(); }
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-white/10 bg-ink-900/60 px-4 backdrop-blur-2xl md:px-6">
      <button onClick={onMenu} className="rounded-lg p-2 text-slate-300 hover:bg-white/5 lg:hidden">
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden md:block">
        <h1 className="font-display text-lg font-semibold text-white">{title}</h1>
        <p className="text-xs text-slate-500">{meta.label} workspace · {user.department}</p>
      </div>

      {/* Search */}
      <div className="relative ml-auto hidden max-w-xs flex-1 md:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search certificates, IDs, people…"
          className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-9 text-sm text-white placeholder:text-slate-500 focus:border-electric-400/50 focus:outline-none focus:ring-2 focus:ring-electric-400/30"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); searchRef.current?.focus(); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-500 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        <AnimatePresence>
          {open && query.trim() && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.16 }}
                className="absolute right-0 z-20 mt-2 max-h-[60vh] w-full min-w-[22rem] overflow-auto rounded-xl border border-white/10 bg-ink-900 p-2 shadow-2xl shadow-black/60"
              >
                {results.length === 0 ? (
                  <p className="px-3 py-6 text-center text-sm text-slate-500">
                    No matches for “{query.trim()}”
                  </p>
                ) : (
                  results.map((item, i) => (
                    <button
                      key={`${item.type}-${item.title}-${i}`}
                      onMouseEnter={() => setActive(i)}
                      onClick={() => go(item)}
                      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                        i === active ? 'bg-electric-500/15' : 'hover:bg-white/5'
                      }`}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-electric-200">
                        <item.icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-white">{item.title}</span>
                        <span className="block truncate text-xs text-slate-500">{item.subtitle}</span>
                      </span>
                      <span className="shrink-0 rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">
                        {item.type}
                      </span>
                      {i === active && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-slate-500" />}
                    </button>
                  ))
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="ml-auto flex items-center gap-2 md:ml-0">
        <div className="hidden items-center gap-1.5 rounded-full border border-electric-400/30 bg-electric-500/10 px-3 py-1.5 text-xs font-medium text-electric-200 sm:flex">
          <Sparkles className="h-3.5 w-3.5" /> AI Online
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotif((s) => !s)}
            className="relative rounded-xl p-2.5 text-slate-300 transition-colors hover:bg-white/5"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
          </button>
          <AnimatePresence>
            {showNotif && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowNotif(false)} />
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  className="glass-strong absolute right-0 z-20 mt-2 w-80 rounded-xl p-2"
                >
                  <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Notifications</p>
                  {NOTIFICATIONS.map((n) => (
                    <div key={n.id} className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-white/5">
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full bg-${n.tone}-400`} />
                      <div>
                        <p className="text-sm text-slate-200">{n.text}</p>
                        <p className="text-xs text-slate-500">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-electric-gradient text-xs font-bold text-white">
          {initials(user.name)}
        </div>
      </div>
    </header>
  );
}
