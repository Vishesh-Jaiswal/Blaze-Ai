import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';
import AuthLayout from './AuthLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { useAuthStore } from '@/store/authStore';
import { ROLES, ROLE_META } from '@/config/roles';
import { DEPARTMENTS } from '@/data/mockData';
import { useToast } from '@/store/toastStore';

const ROLE_OPTIONS = Object.values(ROLES).map((r) => ({ value: r, label: ROLE_META[r].label }));

export default function Signup() {
  const navigate = useNavigate();
  const signup = useAuthStore((s) => s.signup);
  const status = useAuthStore((s) => s.status);
  const toast = useToast();

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
      title="Create your account"
      subtitle="Join the Mavericks credential ecosystem."
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Role" value={form.role} onChange={set('role')} options={ROLE_OPTIONS} />
          <Select label="Department" value={form.department} onChange={set('department')} options={DEPARTMENTS} />
        </div>
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
