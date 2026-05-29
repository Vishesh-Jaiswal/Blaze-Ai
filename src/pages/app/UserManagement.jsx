import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Search, UserPlus, MoreVertical, Shield } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Select from '@/components/ui/Select';
import { ROLE_META, ROLES } from '@/config/roles';
import { DEPARTMENTS } from '@/data/mockData';
import { initials } from '@/lib/utils';
import { useToast } from '@/store/toastStore';

const NAMES = [
  'Aarav Sharma', 'Priya Nair', 'Rohan Mehta', 'Kavya Reddy', 'Diya Patel', 'Vivaan Iyer',
  'Ananya Rao', 'Arjun Kapoor', 'Ishaan Verma', 'Saanvi Gupta', 'Myra Joshi', 'Aditya Menon',
];
const ROLE_VALUES = Object.values(ROLES);

const SEED_USERS = NAMES.map((name, i) => ({
  id: `u-${i}`,
  name,
  email: name.toLowerCase().replace(/\s+/g, '.') + '@hexaware.com',
  role: ROLE_VALUES[i % ROLE_VALUES.length],
  department: DEPARTMENTS[i % DEPARTMENTS.length],
  status: i % 5 === 0 ? 'invited' : 'active',
  certificates: (i * 3) % 12,
}));

export default function UserManagement() {
  const toast = useToast();
  const [users] = useState(SEED_USERS);
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const roleOptions = [{ value: 'all', label: 'All roles' }, ...ROLE_VALUES.map((r) => ({ value: r, label: ROLE_META[r].label }))];

  const filtered = useMemo(
    () =>
      users.filter((u) => {
        const q = !query || u.name.toLowerCase().includes(query.toLowerCase()) || u.email.includes(query.toLowerCase());
        const r = roleFilter === 'all' || u.role === roleFilter;
        return q && r;
      }),
    [users, query, roleFilter]
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

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatPill label="Total users" value={users.length} />
        <StatPill label="Active" value={users.filter((u) => u.status === 'active').length} tone="emerald" />
        <StatPill label="Invited" value={users.filter((u) => u.status === 'invited').length} tone="amber" />
        <StatPill label="Admins" value={users.filter((u) => u.role !== ROLES.MAVERICK && u.role !== ROLES.VERIFIER).length} tone="violet" />
      </div>

      <GlassCard className="mb-6 flex flex-col gap-3 p-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search users…"
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-electric-400/50 focus:outline-none focus:ring-2 focus:ring-electric-400/30"
          />
        </div>
        <div className="sm:w-52"><Select value={roleFilter} onChange={setRoleFilter} options={roleOptions} /></div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <div className="hidden grid-cols-12 gap-2 border-b border-white/10 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 sm:grid">
          <span className="col-span-4">User</span>
          <span className="col-span-3">Department</span>
          <span className="col-span-2">Role</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-1 text-right">Certs</span>
        </div>
        {filtered.map((u, i) => (
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
                <p className="truncate font-medium text-white">{u.name}</p>
                <p className="truncate text-xs text-slate-500">{u.email}</p>
              </div>
            </div>
            <span className="col-span-3 hidden text-slate-400 sm:block">{u.department}</span>
            <span className="col-span-2 hidden sm:block"><Badge tone={ROLE_META[u.role].tone}>{ROLE_META[u.role].label}</Badge></span>
            <span className="col-span-2 hidden sm:block"><Badge tone={u.status === 'active' ? 'success' : 'warning'} dot>{u.status}</Badge></span>
            <span className="col-span-1 hidden text-right text-slate-400 sm:block">{u.certificates}</span>
          </motion.div>
        ))}
      </GlassCard>
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
