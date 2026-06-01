import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, UserPlus, Shield, Sparkles } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import { ROLE_META, ROLES } from '@/config/roles';
import { initials, timeAgo } from '@/lib/utils';
import { useToast } from '@/store/toastStore';
import { listUsers } from '@/services/authService';
import { listCertificates } from '@/services/certificateService';
import { DEMO_USERS } from '@/data/mockData';

const ROLE_VALUES = Object.values(ROLES);

export default function UserManagement() {
  const toast = useToast();
  const [users, setUsers] = useState(null);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Pull real users (everyone in the localStorage user DB — seeds + signups)
  // and join in their cert counts.
  useEffect(() => {
    Promise.all([listUsers(), listCertificates()]).then(([allUsers, allCerts]) => {
      const enriched = allUsers.map((u) => {
        const certs = allCerts.filter((c) => c.recipientId === u.id || c.recipientName === u.name);
        return {
          ...u,
          certificates: certs.length,
          isSeed: DEMO_USERS.some((d) => d.email === u.email),
        };
      });
      setUsers(enriched);
    });
  }, []);

  const roleOptions = useMemo(
    () => [{ value: 'all', label: 'All roles' }, ...ROLE_VALUES.map((r) => ({ value: r, label: ROLE_META[r].label }))],
    []
  );

  const filtered = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => {
      const q = !query
        || u.name.toLowerCase().includes(query.toLowerCase())
        || u.email.toLowerCase().includes(query.toLowerCase());
      const r = roleFilter === 'all' || u.role === roleFilter;
      return q && r;
    });
  }, [users, query, roleFilter]);

  // Sort: newest signups first, then seeds.
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      // Real signups (non-seed) first
      if (a.isSeed !== b.isSeed) return a.isSeed ? 1 : -1;
      // Within group, by joinedAt desc
      return new Date(b.joinedAt || 0) - new Date(a.joinedAt || 0);
    });
  }, [filtered]);

  const newSignups = useMemo(
    () => (users || []).filter((u) => !u.isSeed).length,
    [users]
  );

  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        icon={Users}
        title="User Management"
        description="Manage Mavericks, admins and external verifiers across the platform."
        actions={<Button icon={UserPlus} onClick={() => toast.info('Invite flow — connect to your IdP in production')}>Invite user</Button>}
      />

      {users && newSignups > 0 && (
        <GlassCard glow strong className="mb-6 flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric-gradient text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-white">{newSignups} new Maverick account{newSignups === 1 ? '' : 's'} created</p>
            <p className="text-xs text-slate-400">Self-signed up via the registration page · shown with a "New" badge below.</p>
          </div>
        </GlassCard>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatPill label="Total users" value={users?.length ?? '—'} />
        <StatPill label="Mavericks" value={users ? users.filter((u) => u.role === ROLES.MAVERICK).length : '—'} tone="emerald" />
        <StatPill label="New signups" value={users ? newSignups : '—'} tone="amber" />
        <StatPill label="Admins" value={users ? users.filter((u) => u.role !== ROLES.MAVERICK).length : '—'} tone="violet" />
      </div>

      <GlassCard className="relative z-20 mb-6 flex flex-col gap-3 p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email…"
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-electric-400/50 focus:outline-none focus:ring-2 focus:ring-electric-400/30"
          />
        </div>
        <div className="sm:w-52"><Select value={roleFilter} onChange={setRoleFilter} options={roleOptions} /></div>
      </GlassCard>

      {!users ? (
        <div className="flex h-48 items-center justify-center"><Spinner label="Loading users…" /></div>
      ) : sorted.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <Users className="h-10 w-10 text-slate-600" />
          <p className="text-slate-400">No users match your filters.</p>
        </GlassCard>
      ) : (
        <GlassCard className="overflow-hidden">
          <div className="hidden grid-cols-12 gap-2 border-b border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:grid">
            <span className="col-span-4">User</span>
            <span className="col-span-3">Department</span>
            <span className="col-span-2">Role</span>
            <span className="col-span-2">Joined</span>
            <span className="col-span-1 text-right">Certs</span>
          </div>
          {sorted.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="grid grid-cols-2 items-center gap-2 border-b border-white/5 px-5 py-3 text-sm transition-colors hover:bg-white/[0.03] sm:grid-cols-12"
            >
              <div className="col-span-2 flex items-center gap-3 sm:col-span-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-electric-gradient text-xs font-bold text-white">{initials(u.name)}</span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate font-medium text-white">
                    {u.name}
                    {!u.isSeed && <Badge tone="electric">New</Badge>}
                  </p>
                  <p className="truncate text-xs text-slate-500">{u.email}</p>
                </div>
              </div>
              <span className="col-span-3 hidden text-slate-400 sm:block">{u.department}</span>
              <span className="col-span-2 hidden sm:block"><Badge tone={ROLE_META[u.role].tone}>{ROLE_META[u.role].label}</Badge></span>
              <span className="col-span-2 hidden text-xs text-slate-500 sm:block">{u.joinedAt ? timeAgo(u.joinedAt) : '—'}</span>
              <span className="col-span-1 hidden text-right text-slate-400 sm:block">{u.certificates}</span>
            </motion.div>
          ))}
        </GlassCard>
      )}
    </div>
  );
}

function StatPill({ label, value, tone = 'electric' }) {
  const tones = { electric: 'text-electric-300', emerald: 'text-emerald-300', amber: 'text-amber-300', violet: 'text-violetglow-300' };
  return (
    <GlassCard className="flex items-center gap-3 p-4">
      <Shield className={`h-8 w-8 ${tones[tone]}`} />
      <div>
        <p className="font-display text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-slate-400">{label}</p>
      </div>
    </GlassCard>
  );
}
