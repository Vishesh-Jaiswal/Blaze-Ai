import { useEffect, useMemo, useState } from 'react';
import { Award, Search, Filter } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Select from '@/components/ui/Select';
import Spinner from '@/components/ui/Spinner';
import CertificateCard from '@/components/certificate/CertificateCard';
import CertificateModal from '@/components/certificate/CertificateModal';
import { listCertificates } from '@/services/certificateService';
import { useAuthStore } from '@/store/authStore';
import { ROLES } from '@/config/roles';
import { SEED_CERTIFICATES, DEMO_USERS } from '@/data/mockData';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'issued', label: 'Issued' },
  { value: 'pending', label: 'Pending' },
  { value: 'revoked', label: 'Revoked' },
];

export default function MyCertificates() {
  const user = useAuthStore((s) => s.user);
  const [all, setAll] = useState(null);
  const [active, setActive] = useState(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');

  const isMaverick = user.role === ROLES.MAVERICK;
  const isDemoUser = DEMO_USERS.some((u) => u.email === user.email);

  useEffect(() => {
    listCertificates()
      .then((list) => {
        if (isMaverick) {
          const mine = list.filter((c) => c.recipientName === user.name || c.recipientId === user.id);
          if (mine.length) return setAll(mine);
          if (isDemoUser) {
            setAll(SEED_CERTIFICATES.slice(0, 6).map((c) => ({ ...c, recipientName: user.name })));
          } else {
            setAll([]);
          }
        } else {
          setAll(list);
        }
      })
      .catch(() => setAll([])); // Empty state on failure instead of perpetual spinner.
  }, [user.id, user.name, isMaverick, isDemoUser]);

  const filtered = useMemo(() => {
    if (!all) return [];
    return all.filter((c) => {
      const matchesQuery =
        !query ||
        c.course.toLowerCase().includes(query.toLowerCase()) ||
        c.recipientName.toLowerCase().includes(query.toLowerCase()) ||
        c.id.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === 'all' || c.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [all, query, status]);

  return (
    <div>
      <PageHeader
        eyebrow="Credentials"
        icon={Award}
        title={isMaverick ? 'My Certificates' : 'All Certificates'}
        description={isMaverick ? 'Every achievement you have earned, ready to download and share.' : 'The full credential registry across all Mavericks.'}
      />

      <GlassCard className="relative z-20 mb-6 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by course, name or certificate ID…"
            className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-electric-400/50 focus:outline-none focus:ring-2 focus:ring-electric-400/30"
          />
        </div>
        <div className="sm:w-48">
          <Select value={status} onChange={setStatus} options={STATUS_OPTIONS} />
        </div>
      </GlassCard>

      {!all ? (
        <div className="flex h-64 items-center justify-center"><Spinner label="Loading credentials…" /></div>
      ) : filtered.length === 0 ? (
        <GlassCard className="flex flex-col items-center justify-center gap-3 p-16 text-center">
          <Filter className="h-10 w-10 text-slate-600" />
          <p className="text-slate-400">No certificates match your filters.</p>
        </GlassCard>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((c, i) => (
            <CertificateCard key={c.id} cert={c} index={i} onClick={() => setActive(c)} />
          ))}
        </div>
      )}

      <CertificateModal cert={active} open={!!active} onClose={() => setActive(null)} />
    </div>
  );
}
