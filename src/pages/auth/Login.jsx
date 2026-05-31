import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, KeyRound, Building2 } from 'lucide-react';
import AuthLayout from './AuthLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { ROLE_META } from '@/config/roles';
import { useToast } from '@/store/toastStore';
import { DEMO_USERS } from '@/data/mockData';

const REMEMBER_KEY = 'mc.remember.email';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const status = useAuthStore((s) => s.status);
  const toast = useToast();

  // Pre-fill from the last "remembered" non-demo login.
  const initialEmail = (() => {
    try { return localStorage.getItem(REMEMBER_KEY) || ''; } catch (_) { return ''; }
  })();
  const [form, setForm] = useState({ email: initialEmail, password: '' });
  const [remember, setRemember] = useState(Boolean(initialEmail));
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(form);
      // Remember the email for the next visit — but only for real accounts.
      // Demo logins shouldn't pollute the prefill for the next user demoing the app.
      const isDemo = DEMO_USERS.some((d) => d.email.toLowerCase() === user.email.toLowerCase());
      try {
        if (remember && !isDemo) localStorage.setItem(REMEMBER_KEY, user.email);
        else localStorage.removeItem(REMEMBER_KEY);
      } catch (_) {}
      toast.success(`Welcome back, ${user.name.split(' ')[0]}!`);
      const dest = location.state?.from?.pathname || ROLE_META[user.role]?.home || '/app';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  const quickFill = (email) => setForm({ email, password: 'demo1234' });

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Mavericks Certify workspace."
      footer={
        <>
          New to the platform?{' '}
          <Link to="/signup" className="font-medium text-electric-300 hover:text-electric-200">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <Input
          label="Work email"
          icon={Mail}
          type="email"
          placeholder="you@hexaware.com"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          autoComplete="email"
        />
        <Input
          label="Password"
          icon={Lock}
          type="password"
          placeholder="••••••••"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          autoComplete="current-password"
          error={error}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-slate-400">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/5 accent-electric-500"
            />
            Remember me
          </label>
          <Link to="/forgot-password" className="text-electric-300 hover:text-electric-200">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" loading={status === 'loading'} iconRight={ArrowRight} className="w-full">
          Sign in
        </Button>
      </form>

      {/* Enterprise SSO */}
      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-white/10" />
        <span className="text-xs text-slate-500">or continue with</span>
        <div className="h-px flex-1 bg-white/10" />
      </div>
      <Button
        variant="secondary"
        size="lg"
        icon={Building2}
        className="w-full"
        onClick={() => toast.info('Enterprise SSO is configured per-tenant. Demo uses email sign-in.')}
      >
        Hexaware Enterprise SSO
      </Button>

      {/* Demo accounts */}
      <div className="mt-8 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <p className="mb-3 flex items-center gap-2 text-xs font-medium text-slate-400">
          <KeyRound className="h-3.5 w-3.5" /> Demo accounts (password: demo1234)
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {DEMO_USERS.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => quickFill(u.email)}
              className="flex flex-col rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-left transition-colors hover:border-electric-400/40 hover:bg-electric-500/10"
            >
              <span className="text-xs font-medium text-white">{ROLE_META[u.role].label}</span>
              <span className="truncate text-[11px] text-slate-500">{u.email}</span>
            </button>
          ))}
        </div>
      </div>
    </AuthLayout>
  );
}
