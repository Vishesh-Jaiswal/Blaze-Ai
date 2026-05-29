import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, LogOut, X, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { navForRole, ROLE_META } from '@/config/roles';
import { cn, initials } from '@/lib/utils';
import Badge from '@/components/ui/Badge';

function NavLinks({ items, onNavigate }) {
  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all',
              isActive
                ? 'bg-electric-500/15 text-white'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-electric-gradient shadow-glow-sm"
                />
              )}
              <item.icon className={cn('h-4.5 w-4.5 shrink-0', isActive && 'text-electric-300')} />
              <span>{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function SidebarContent({ onNavigate }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const items = navForRole(user.role);
  const meta = ROLE_META[user.role];

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-2 py-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric-gradient shadow-glow-sm">
          <ShieldCheck className="h-5.5 w-5.5 text-white" />
        </div>
        <div>
          <p className="font-display text-sm font-bold leading-tight text-white">Mavericks Certify</p>
          <p className="text-[10px] text-slate-500">Hexaware Technologies</p>
        </div>
      </div>

      <div className="my-5 h-px bg-white/10" />

      <div className="flex-1 overflow-y-auto no-scrollbar">
        <p className="mb-2 px-3.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">Workspace</p>
        <NavLinks items={items} onNavigate={onNavigate} />
      </div>

      {/* Upgrade / AI banner */}
      <div className="mt-4 overflow-hidden rounded-xl border border-electric-400/20 bg-electric-500/10 p-3.5">
        <div className="flex items-center gap-2 text-electric-200">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold">AI Engine Active</span>
        </div>
        <p className="mt-1 text-[11px] text-slate-400">Narratives, templates & fraud scoring powered by AI.</p>
      </div>

      {/* User */}
      <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-electric-gradient text-xs font-bold text-white">
          {initials(user.name)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-white">{user.name}</p>
          <Badge tone={meta.tone} className="mt-0.5">{meta.label}</Badge>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
          title="Sign out"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

export default function Sidebar({ mobileOpen, onClose }) {
  return (
    <>
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-white/10 bg-ink-800/60 p-4 backdrop-blur-2xl lg:flex">
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-ink-900/70 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/10 bg-ink-800 p-4 lg:hidden"
            >
              <button onClick={onClose} className="absolute right-3 top-3 rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white">
                <X className="h-5 w-5" />
              </button>
              <SidebarContent onNavigate={onClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
