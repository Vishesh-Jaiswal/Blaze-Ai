import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, Search, Bell, Sparkles, Award, User, CornerDownLeft, X, Sun, Moon,
  Brain, ShieldCheck, Palette, BellOff, Check, AlertTriangle, Activity,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { ROLE_META, navForRole, ROLES } from '@/config/roles';
import { SEED_CERTIFICATES, LEADERBOARD, DEMO_USERS } from '@/data/mockData';
import { listCertificates } from '@/services/certificateService';
import { listEvents, EVENT_TYPES } from '@/services/activityService';
import { initials, timeAgo } from '@/lib/utils';

const timeAgoMs = (ms) => timeAgo(new Date(ms).toISOString());

/**
 * Format a stored activity event into a notification card.
 * Returns null for event types we don't want to surface in the bell.
 */
function formatEventAsNotification(event) {
  const p = event.payload || {};
  switch (event.type) {
    case EVENT_TYPES.APPROVED:
      return {
        id: event.id,
        icon: Check,
        tone: 'emerald',
        text: `Your "${p.certificateName}" was approved and issued.`,
        when: event.at,
      };
    case EVENT_TYPES.REJECTED:
      return {
        id: event.id,
        icon: AlertTriangle,
        tone: 'rose',
        text: `Your "${p.certificateName}" was rejected. See My Submissions for feedback.`,
        when: event.at,
      };
    case EVENT_TYPES.SUBMITTED:
      return {
        id: event.id,
        icon: Sparkles,
        tone: 'electric',
        text: `Submitted "${p.certificateName}" — awaiting admin review.`,
        when: event.at,
      };
    case EVENT_TYPES.ISSUED:
      return {
        id: event.id,
        icon: Award,
        tone: 'violet',
        text: `New certificate issued to you: "${p.certificateName}".`,
        when: event.at,
      };
    case EVENT_TYPES.VERIFIED:
      return {
        id: event.id,
        icon: Check,
        tone: 'emerald',
        text: `Your certificate was verified${p.by ? ` by ${p.by}` : ''}.`,
        when: event.at,
      };
    default:
      return null;
  }
}

const AI_CAPABILITIES = [
  { icon: Brain, label: 'Narrative generation', status: 'active' },
  { icon: ShieldCheck, label: 'Fraud forensics', status: 'active' },
  { icon: Palette, label: 'Template recommendation', status: 'active' },
  { icon: Activity, label: 'Skill suggestion', status: 'active' },
];

/**
 * Build the notifications list:
 * - Real activity events for THIS user (approvals, rejections, submissions, verifications)
 * - Plus role-flavored demo-only baseline so demo accounts always feel alive
 * Sorted by recency, capped at 8.
 */
function buildNotifications({ user, isDemoUser }) {
  const fromActivity = listEvents(user.id)
    .map(formatEventAsNotification)
    .filter(Boolean);

  // Admin-flavored demo baseline (no real source for these yet)
  const adminBaseline = (!isDemoUser || user.role === ROLES.MAVERICK || user.role === ROLES.VERIFIER) ? [] : [
    { id: 'baseline-1', icon: Check, tone: 'emerald', text: 'New certificate verified by Acme Corp.', when: Date.now() - 2 * 60 * 1000 },
    { id: 'baseline-2', icon: AlertTriangle, tone: 'rose', text: 'Fraud attempt blocked on REQ-2026-0502.', when: Date.now() - 60 * 60 * 1000 },
    { id: 'baseline-3', icon: Sparkles, tone: 'amber', text: '12 certificates are pending your approval.', when: Date.now() - 3 * 3600 * 1000 },
  ];

  return [...fromActivity, ...adminBaseline]
    .sort((a, b) => b.when - a.when)
    .slice(0, 8);
}

const TONE_BG = {
  emerald: 'bg-emerald-500/15 text-emerald-300',
  rose: 'bg-rose-500/15 text-rose-300',
  amber: 'bg-amber-500/15 text-amber-300',
  electric: 'bg-electric-500/15 text-electric-200',
  violet: 'bg-violetglow-500/15 text-violetglow-300',
};

export default function Topbar({ onMenu, title }) {
  const user = useAuthStore((s) => s.user);
  const meta = ROLE_META[user.role];
  const navigate = useNavigate();
  const mode = useThemeStore((s) => s.mode);
  const toggleMode = useThemeStore((s) => s.toggleMode);

  const isDemoUser = useMemo(() => DEMO_USERS.some((d) => d.email === user.email), [user.email]);
  const isMaverick = user.role === ROLES.MAVERICK;

  const [openMenu, setOpenMenu] = useState(null); // 'search' | 'notif' | 'ai' | null
  const [query, setQuery] = useState('');
  const [searchActive, setSearchActive] = useState(0);
  const [userCerts, setUserCerts] = useState([]);
  const NOTIF_READ_KEY = `mc.notif.lastRead.${user.id}`;
  const [lastRead, setLastRead] = useState(() => {
    try { return Number(localStorage.getItem(NOTIF_READ_KEY)) || 0; } catch { return 0; }
  });

  const searchRef = useRef(null);
  const searchContainerRef = useRef(null);
  const notifRef = useRef(null);
  const aiRef = useRef(null);

  // Load real certs once per session — search scope reflects what THIS user actually owns.
  useEffect(() => {
    listCertificates().then((all) => {
      if (isMaverick) {
        const mine = all.filter((c) => c.recipientName === user.name || c.recipientId === user.id);
        if (mine.length) setUserCerts(mine);
        else if (isDemoUser) {
          // Demo Maverick gets the sample registry renamed to them (same as the dashboard)
          setUserCerts(SEED_CERTIFICATES.slice(0, 6).map((c) => ({ ...c, recipientName: user.name })));
        } else {
          setUserCerts([]);
        }
      } else {
        // Admins/L&D/Verifiers can search the full registry
        setUserCerts(all);
      }
    });
  }, [user.id, user.name, user.email, isMaverick, isDemoUser]);

  // Build the search index from real, role-scoped data.
  const index = useMemo(() => {
    const pages = navForRole(user.role).map((n) => ({
      type: 'Page', title: n.label, subtitle: 'Go to page', to: n.to, icon: n.icon,
    }));
    const certs = userCerts.map((c) => ({
      type: 'Certificate', title: c.course, subtitle: `${c.recipientName} · ${c.id}`,
      to: '/app/certificates', icon: Award,
      keywords: `${c.id} ${c.recipientName} ${c.department} ${(c.skills || []).join(' ')}`,
    }));
    const people = isMaverick
      ? []
      : LEADERBOARD.map((p) => ({
          type: 'Person', title: p.name, subtitle: `${p.department} · Rank #${p.rank}`,
          to: '/app/leaderboard', icon: User,
        }));
    return [...pages, ...certs, ...people];
  }, [user.role, userCerts, isMaverick]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return index
      .filter((item) =>
        `${item.title} ${item.subtitle} ${item.keywords || ''}`.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [query, index]);

  useEffect(() => { setSearchActive(0); }, [query]);

  // Unified outside-click handler for ALL dropdowns.
  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e) => {
      const inside = (ref) => ref.current && ref.current.contains(e.target);
      if (openMenu === 'search' && inside(searchContainerRef)) return;
      if (openMenu === 'notif' && inside(notifRef)) return;
      if (openMenu === 'ai' && inside(aiRef)) return;
      setOpenMenu(null);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [openMenu]);

  // Esc closes whichever menu is open.
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setOpenMenu(null); };
    if (openMenu) document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [openMenu]);

  const go = (item) => {
    if (!item) return;
    navigate(item.to);
    setQuery('');
    setOpenMenu(null);
    searchRef.current?.blur();
  };

  const onSearchKey = (e) => {
    if (openMenu !== 'search' || results.length === 0) {
      if (e.key === 'Escape') { setQuery(''); searchRef.current?.blur(); }
      return;
    }
    if (e.key === 'ArrowDown') { e.preventDefault(); setSearchActive((a) => (a + 1) % results.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSearchActive((a) => (a - 1 + results.length) % results.length); }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[searchActive]); }
    else if (e.key === 'Escape') { setOpenMenu(null); setQuery(''); searchRef.current?.blur(); }
  };

  const notifications = useMemo(() => buildNotifications({ user, isDemoUser }), [user, isDemoUser, openMenu]);
  const unreadCount = useMemo(
    () => notifications.filter((n) => n.when > lastRead).length,
    [notifications, lastRead]
  );

  const openNotif = () => {
    if (openMenu === 'notif') {
      setOpenMenu(null);
      return;
    }
    setOpenMenu('notif');
    // Mark all current notifications as read.
    const now = Date.now();
    setLastRead(now);
    try { localStorage.setItem(NOTIF_READ_KEY, String(now)); } catch {}
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
      <div className="relative ml-auto hidden max-w-xs flex-1 md:block" ref={searchContainerRef}>
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpenMenu('search'); }}
          onFocus={() => setOpenMenu('search')}
          onKeyDown={onSearchKey}
          placeholder={isMaverick ? 'Search your certificates, pages…' : 'Search certificates, IDs, people…'}
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
          {openMenu === 'search' && query.trim() && (
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
                    onMouseEnter={() => setSearchActive(i)}
                    onClick={() => go(item)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      i === searchActive ? 'bg-electric-500/15' : 'hover:bg-white/5'
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
                    {i === searchActive && <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-slate-500" />}
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="ml-auto flex items-center gap-2 md:ml-0">
        {/* AI Online — now interactive */}
        <div className="relative hidden sm:block" ref={aiRef}>
          <button
            onClick={() => setOpenMenu((m) => (m === 'ai' ? null : 'ai'))}
            aria-label="AI engine status"
            className="flex items-center gap-1.5 rounded-full border border-electric-400/30 bg-electric-500/10 px-3 py-1.5 text-xs font-medium text-electric-200 transition-colors hover:bg-electric-500/20"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_currentColor]" />
            </span>
            <Sparkles className="h-3.5 w-3.5" /> AI Online
          </button>
          <AnimatePresence>
            {openMenu === 'ai' && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                className="absolute right-0 z-20 mt-2 w-72 rounded-xl border border-white/10 bg-ink-900 p-3 shadow-2xl shadow-black/60"
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">AI Engine</p>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_currentColor]" /> Operational
                  </span>
                </div>
                <div className="space-y-1">
                  {AI_CAPABILITIES.map((c) => (
                    <div key={c.label} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5">
                      <c.icon className="h-4 w-4 shrink-0 text-electric-300" />
                      <span className="flex-1 text-sm text-slate-200">{c.label}</span>
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    </div>
                  ))}
                </div>
                <div className="mt-2 border-t border-white/10 pt-2 text-[11px] text-slate-500">
                  Powered by an LLM proxy. Last sync just now.
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Light / dark mode quick toggle */}
        <button
          onClick={toggleMode}
          aria-label={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          title={mode === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          className="rounded-xl p-2.5 text-slate-300 transition-colors hover:bg-white/5"
        >
          {mode === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={openNotif}
            className="relative rounded-xl p-2.5 text-slate-300 transition-colors hover:bg-white/5"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
            )}
          </button>
          <AnimatePresence>
            {openMenu === 'notif' && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                className="absolute right-0 z-20 mt-2 w-80 rounded-xl border border-white/10 bg-ink-900 p-2 shadow-2xl shadow-black/60"
              >
                <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Notifications</p>
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
                    <BellOff className="h-6 w-6 text-slate-600" />
                    <p className="text-sm text-slate-400">You're all caught up</p>
                    <p className="text-xs text-slate-500">New activity will appear here.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="flex items-start gap-3 rounded-lg px-3 py-2.5 hover:bg-white/5">
                      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${TONE_BG[n.tone] || TONE_BG.electric}`}>
                        <n.icon className="h-3.5 w-3.5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-200">{n.text}</p>
                        <p className="text-xs text-slate-500">{timeAgo(n.when)}</p>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
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
