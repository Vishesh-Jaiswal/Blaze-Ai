import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Sparkles } from 'lucide-react';
import AuthLayout from './AuthLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { useAuthStore } from '@/store/authStore';
import { ROLES } from '@/config/roles';
import { DEPARTMENTS } from '@/data/mockData';
import { useToast } from '@/store/toastStore';

export default function Signup() {
  const navigate = useNavigate();
  const signup = useAuthStore((s) => s.signup);
  const status = useAuthStore((s) => s.status);
  const toast = useToast();

  // Self-signup is always a Maverick account. HR/L&D/Admin accounts are
  // provisioned by the platform owner; external verifiers don't self-register.
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: ROLES.MAVERICK,
    department: DEPARTMENTS[0],
  });
  const [error, setError] = useState('');

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v?.target ? v.target.value : v }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    try {
      await signup(form);
      toast.success('Account created! Verify your email to continue.');
      navigate('/verify-otp', { state: { email: form.email } });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <AuthLayout
      title="Create your Maverick account"
      subtitle="Join the Hexaware Mavericks credential ecosystem."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-electric-300 hover:text-electric-200">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-electric-400/20 bg-electric-500/10 p-3 text-xs text-electric-200">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Self-signup creates a Maverick account. HR, L&amp;D and Admin accounts are provisioned by your platform owner.
          </span>
        </div>
        <Input
          label="Full name"
          icon={User}
          placeholder="Aarav Sharma"
          value={form.name}
          onChange={set('name')}
          required
        />
        <Input
          label="Work email"
          icon={Mail}
          type="email"
          placeholder="you@hexaware.com"
          value={form.email}
          onChange={set('email')}
          required
          error={error}
        />
        <Select label="Department" value={form.department} onChange={set('department')} options={DEPARTMENTS} />
        <Input
          label="Password"
          icon={Lock}
          type="password"
          placeholder="At least 6 characters"
          value={form.password}
          onChange={set('password')}
          required
          hint="Use 6+ characters with a mix of letters and numbers."
        />

        <label className="flex items-start gap-2 text-xs text-slate-400">
          <input type="checkbox" required className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 accent-electric-500" />
          I agree to Hexaware's Terms of Service and acknowledge the Privacy Policy.
        </label>

        <Button type="submit" size="lg" loading={status === 'loading'} iconRight={ArrowRight} className="w-full">
          Create account
        </Button>
      </form>
    </AuthLayout>
  );
}
