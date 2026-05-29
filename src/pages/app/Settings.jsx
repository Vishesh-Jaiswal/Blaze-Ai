import { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Palette, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { ROLE_META } from '@/config/roles';
import { useToast } from '@/store/toastStore';
import { initials } from '@/lib/utils';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-11 rounded-full transition-colors', checked ? 'bg-electric-500' : 'bg-white/10')}
    >
      <span className={cn('absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
    </button>
  );
}

export default function Settings() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const toast = useToast();
  const meta = ROLE_META[user.role];
  const [tab, setTab] = useState('profile');
  const [notif, setNotif] = useState({ email: true, verifications: true, fraud: true, weekly: false });

  return (
    <div>
      <PageHeader eyebrow="Account" icon={SettingsIcon} title="Settings" description="Manage your profile, security and preferences." />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <GlassCard className="h-fit p-3">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn('flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                tab === t.id ? 'bg-electric-500/15 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white')}
            >
              <t.icon className="h-4.5 w-4.5" /> {t.label}
            </button>
          ))}
          <div className="my-2 h-px bg-white/10" />
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-rose-400 transition-colors hover:bg-rose-500/10"
          >
            <LogOut className="h-4.5 w-4.5" /> Sign out
          </button>
        </GlassCard>

        <GlassCard className="p-6">
          {tab === 'profile' && (
            <div className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-electric-gradient text-xl font-bold text-white shadow-glow">{initials(user.name)}</div>
                <div>
                  <p className="font-display text-lg font-semibold text-white">{user.name}</p>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Full name" defaultValue={user.name} />
                <Input label="Email" defaultValue={user.email} />
                <Input label="Department" defaultValue={user.department} />
                <Input label="Title" defaultValue={user.title} />
              </div>
              <Button onClick={() => toast.success('Profile updated')}>Save changes</Button>
            </div>
          )}

          {tab === 'notifications' && (
            <div className="space-y-4">
              {[
                { k: 'email', label: 'Email notifications', desc: 'Receive updates via email' },
                { k: 'verifications', label: 'Verification alerts', desc: 'When your certificates are verified' },
                { k: 'fraud', label: 'Fraud alerts', desc: 'When a fraud attempt is detected' },
                { k: 'weekly', label: 'Weekly digest', desc: 'A summary of your activity each week' },
              ].map((n) => (
                <div key={n.k} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.02] p-4">
                  <div>
                    <p className="text-sm font-medium text-white">{n.label}</p>
                    <p className="text-xs text-slate-500">{n.desc}</p>
                  </div>
                  <Toggle checked={notif[n.k]} onChange={(v) => { setNotif((s) => ({ ...s, [n.k]: v })); toast.info('Preference saved'); }} />
                </div>
              ))}
            </div>
          )}

          {tab === 'security' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
                <Shield className="h-5 w-5" /> Two-factor authentication is enabled.
              </div>
              <Input label="Current password" type="password" placeholder="••••••••" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="New password" type="password" placeholder="••••••••" />
                <Input label="Confirm password" type="password" placeholder="••••••••" />
              </div>
              <Button onClick={() => toast.success('Password updated')}>Update password</Button>
            </div>
          )}

          {tab === 'appearance' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-400">Mavericks Certify uses an immersive dark theme optimised for focus and depth.</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: 'Midnight', g: 'linear-gradient(135deg,#05060f,#10142e)' },
                  { name: 'Electric', g: 'linear-gradient(135deg,#0b3fa3,#06c8ff)' },
                  { name: 'Quantum', g: 'linear-gradient(135deg,#4c1d95,#8b5cf6)' },
                ].map((t, i) => (
                  <button key={t.name} className={cn('rounded-xl border p-3 text-left', i === 0 ? 'border-electric-400/60 ring-2 ring-electric-400/40' : 'border-white/10')}>
                    <div className="mb-2 h-16 w-full rounded-lg" style={{ background: t.g }} />
                    <p className="text-sm text-white">{t.name}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
