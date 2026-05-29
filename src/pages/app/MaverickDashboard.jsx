import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Award, Sparkles, TrendingUp, Flame, ScanLine, Trophy, ArrowRight, Clock, ShieldCheck, UploadCloud,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatCard from '@/components/ui/StatCard';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import CertificateCard from '@/components/certificate/CertificateCard';
import CertificateModal from '@/components/certificate/CertificateModal';
import { MiniBars } from '@/components/charts/Charts';
import Spinner from '@/components/ui/Spinner';
import { useAuthStore } from '@/store/authStore';
import { listCertificates } from '@/services/certificateService';
import { ANALYTICS, SEED_CERTIFICATES } from '@/data/mockData';
import { timeAgo } from '@/lib/utils';

export default function MaverickDashboard() {
  const user = useAuthStore((s) => s.user);
  const [certs, setCerts] = useState(null);
  const [active, setActive] = useState(null);

  useEffect(() => {
    // Show this maverick's certs, falling back to seed data for a rich demo.
    listCertificates().then((all) => {
      const mine = all.filter((c) => c.recipientName === user.name);
      setCerts(mine.length ? mine : SEED_CERTIFICATES.slice(0, 6).map((c) => ({ ...c, recipientName: user.name })));
    });
  }, [user.name]);

  const timeline = [
    { text: 'Earned “Advanced React & System Design”', when: SEED_CERTIFICATES[1].issuedAt, tone: 'electric' },
    { text: 'Verified by Acme Corp recruiter', when: new Date(Date.now() - 86400000).toISOString(), tone: 'cyan' },
    { text: 'Reached a 12-day learning streak', when: new Date(Date.now() - 2 * 86400000).toISOString(), tone: 'violet' },
    { text: 'Completed Cloud Foundations on AWS', when: SEED_CERTIFICATES[0].issuedAt, tone: 'success' },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="My Overview"
        icon={Sparkles}
        title={`Welcome back, ${user.name.split(' ')[0]} 👋`}
        description="Your achievements, recognition and growth — all in one place."
        actions={
          <>
            <Link to="/app/verify">
              <Button icon={ScanLine} variant="secondary">Verify a certificate</Button>
            </Link>
            <Link to="/app/submit">
              <Button icon={UploadCloud}>Submit certificate</Button>
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Certificates earned" value={certs?.length || 6} icon={Award} tone="electric" delta={20} delay={0} />
        <StatCard label="Leaderboard rank" value={3} prefix="#" icon={Trophy} tone="cyan" delta={2} delay={0.05} />
        <StatCard label="Skill points" value={4585} icon={TrendingUp} tone="violet" delta={12} delay={0.1} />
        <StatCard label="Day streak" value={12} suffix="🔥" icon={Flame} tone="warning" delta={8} delay={0.15} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Certificates */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-white">Your latest certificates</h2>
            <Link to="/app/certificates" className="flex items-center gap-1 text-sm text-electric-300 hover:text-electric-200">
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {!certs ? (
            <div className="flex h-48 items-center justify-center"><Spinner label="Loading certificates…" /></div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {certs.slice(0, 4).map((c, i) => (
                <CertificateCard key={c.id} cert={c} index={i} onClick={() => setActive(c)} />
              ))}
            </div>
          )}
        </div>

        {/* Side column */}
        <div className="space-y-6">
          <GlassCard className="p-5">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-white">Weekly activity</h3>
              <Badge tone="violet">+18%</Badge>
            </div>
            <MiniBars data={ANALYTICS.engagement} />
          </GlassCard>

          <GlassCard className="p-5">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-white">
              <Clock className="h-4 w-4 text-electric-300" /> Recognition timeline
            </h3>
            <div className="relative space-y-4 pl-5">
              <div className="absolute bottom-2 left-1.5 top-2 w-px bg-white/10" />
              {timeline.map((t, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="relative"
                >
                  <span className={`absolute -left-[18px] top-1 h-3 w-3 rounded-full bg-${t.tone === 'success' ? 'emerald' : t.tone === 'cyan' ? 'cyanglow' : t.tone === 'violet' ? 'violetglow' : 'electric'}-400 ring-4 ring-ink-900`} style={{ boxShadow: '0 0 8px currentColor' }} />
                  <p className="text-sm text-slate-200">{t.text}</p>
                  <p className="text-xs text-slate-500">{timeAgo(t.when)}</p>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* AI insight banner */}
      <GlassCard glow strong className="mt-6 flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-electric-gradient shadow-glow">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-display text-lg font-semibold text-white">Your credentials are recruiter-ready</h3>
            <p className="text-sm text-slate-400">Share a verifiable QR with any client or hiring manager — fraud-proof and instant.</p>
          </div>
        </div>
        <Link to="/app/certificates"><Button iconRight={ArrowRight}>Manage credentials</Button></Link>
      </GlassCard>

      <CertificateModal cert={active} open={!!active} onClose={() => setActive(null)} />
    </div>
  );
}
