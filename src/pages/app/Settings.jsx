import { useState } from 'react';
import { Settings as SettingsIcon, User, Bell, Shield, Palette, LogOut, Sun, Moon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import GlassCard from '@/components/ui/GlassCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore, THEMES } from '@/store/themeStore';
import { ROLE_META } from '@/config/roles';
import { useToast } from '@/store/toastStore';
import { updatePassword } from '@/services/authService';
import { initials } from '@/lib/utils';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'appearance', label: 'Appearance', icon: Palette },
];

function ReadOnlyField({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-white">{value || '—'}</p>
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn('relative h-6 w-11 shrink-0 rounded-full transition-colors', checked ? 'bg-electric-500' : 'bg-white/10')}
    >
      <span
        className={cn(
          'absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
          checked && 'translate-x-5'
        )}
      />
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
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwBusy, setPwBusy] = useState(false);
  const [pwError, setPwError] = useState('');

  const handlePasswordUpdate = async () => {
    setPwError('');
    if (!pwForm.current || !pwForm.next || !pwForm.confirm) {
      setPwError('All three fields are required.');
      return;
    }
    if (pwForm.next.length < 8) {
      setPwError('New password must be at least 8 characters.');
      return;
    }
    if (pwForm.next !== pwForm.confirm) {
      setPwError('New password and confirmation do not match.');
      return;
    }
    setPwBusy(true);
    try {
      await updatePassword({
        email: user.email,
        currentPassword: pwForm.current,
        newPassword: pwForm.next,
      });
      setPwForm({ current: '', next: '', confirm: '' });
      toast.success('Password updated. Use it on your next sign-in.');
    } catch (e) {
      setPwError(e.message || 'Could not update password.');
    } finally {
      setPwBusy(false);
    }
  };

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
              <div className="grid gap-3 sm:grid-cols-2">
                <ReadOnlyField label="Full name" value={user.name} />
                <ReadOnlyField label="Email" value={user.email} />
                <ReadOnlyField label="Department" value={user.department} />
                <ReadOnlyField label="Title" value={user.title} />
              </div>
              <p className="text-xs text-slate-500">Profile details are managed by HR. Contact your administrator to request changes.</p>
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
              <Input
                label="Current password"
                type="password"
                placeholder="••••••••"
                value={pwForm.current}
                onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
                autoComplete="current-password"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="New password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={pwForm.next}
                  onChange={(e) => setPwForm((f) => ({ ...f, next: e.target.value }))}
                  autoComplete="new-password"
                  hint="Minimum 8 characters"
                />
                <Input
                  label="Confirm password"
                  type="password"
                  placeholder="Re-enter new password"
                  value={pwForm.confirm}
                  onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
                  autoComplete="new-password"
                  error={pwForm.confirm && pwForm.next && pwForm.confirm !== pwForm.next ? 'Does not match' : undefined}
                />
              </div>
              {pwError && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
                  {pwError}
                </div>
              )}
              <Button loading={pwBusy} onClick={handlePasswordUpdate}>Update password</Button>
            </div>
          )}

          {tab === 'appearance' && (
            <div className="space-y-6">
              {/* Mode (light / dark) */}
              <div>
                <p className="mb-2 text-sm font-medium text-white">Mode</p>
                <p className="mb-3 text-xs text-slate-400">Switch between the immersive dark theme and a bright daylight theme.</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'dark', label: 'Dark', icon: Moon, hint: 'Cinematic, low-glare' },
                    { id: 'light', label: 'Light', icon: Sun, hint: 'Bright, daylight-friendly' },
                  ].map((m) => {
                    const active = mode === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          if (active) return;
                          setMode(m.id);
                          toast.success(`${m.label} mode applied`);
                        }}
                        className={cn(
                          'flex items-center gap-3 rounded-xl border p-3 text-left transition-all',
                          active
                            ? 'border-electric-400/60 bg-electric-500/10 ring-2 ring-electric-400/40'
                            : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                        )}
                      >
                        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', active ? 'bg-electric-gradient text-white shadow-glow-sm' : 'bg-white/5 text-slate-300')}>
                          <m.icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-white">{m.label}</p>
                          <p className="text-xs text-slate-500">{m.hint}</p>
                        </div>
                        {active && <Badge tone="electric">Active</Badge>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Palette */}
              <div>
                <p className="mb-2 text-sm font-medium text-white">Ambient palette</p>
                <p className="mb-3 text-xs text-slate-400">Color tone for the cinematic background. Layers above stay consistent.</p>
                <div className="grid grid-cols-3 gap-3">
                {Object.entries(THEMES).map(([id, t]) => {
                  const active = theme === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        if (active) return;
                        setTheme(id);
                        toast.success(`${t.name} theme applied`);
                      }}
                      className={cn(
                        'group rounded-xl border p-3 text-left transition-all',
                        active
                          ? 'border-electric-400/60 ring-2 ring-electric-400/40'
                          : 'border-white/10 hover:border-white/30 hover:bg-white/5'
                      )}
                    >
                      <div className="mb-2 h-16 w-full rounded-lg" style={{ background: t.gradient }} />
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-white">{t.name}</p>
                        {active && <Badge tone="electric">Active</Badge>}
                      </div>
                    </button>
                  );
                })}
                </div>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
