import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthLayout from './AuthLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { resetPasswordWithOtp, requestPasswordReset } from '@/services/authService';
import { useToast } from '@/store/toastStore';

const LENGTH = 6;

/**
 * Reset-password flow: enter the 6-digit OTP that ForgotPassword just sent,
 * pick a new password, submit. On success, redirect to login.
 */
export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const email = location.state?.email;

  const [digits, setDigits] = useState(Array(LENGTH).fill(''));
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(30);
  const inputs = useRef([]);

  // Redirect to /forgot-password if no email in state (refresh / direct nav).
  useEffect(() => {
    if (!email) navigate('/forgot-password', { replace: true });
  }, [email, navigate]);

  // Cooldown timer for the resend link.
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleChange = (i, val) => {
    const v = val.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    setError('');
    if (v && i < LENGTH - 1) inputs.current[i + 1]?.focus();
  };

  const handleKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, LENGTH);
    if (pasted) {
      const next = pasted.split('').concat(Array(LENGTH).fill('')).slice(0, LENGTH);
      setDigits(next);
      inputs.current[Math.min(pasted.length, LENGTH - 1)]?.focus();
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < LENGTH) return setError('Please enter all 6 digits.');
    if (newPw.length < 8) return setError('New password must be at least 8 characters.');
    if (newPw !== confirmPw) return setError('Passwords do not match.');
    setLoading(true);
    setError('');
    try {
      await resetPasswordWithOtp({ email, code, newPassword: newPw });
      toast.success('Password updated. Sign in with your new password.');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    try {
      const r = await requestPasswordReset(email);
      toast.info(`Demo code: ${r.devCode}`, { duration: 8000, title: 'New reset code sent' });
      setCooldown(30);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!email) return null;

  return (
    <AuthLayout
      title="Set a new password"
      subtitle={`Enter the 6-digit code we sent to ${email} and pick a new password.`}
      footer={
        <Link to="/login" className="font-medium text-electric-300 hover:text-electric-200">
          ← Back to sign in
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-5">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">Verification code</label>
          <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <motion.input
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKey(i, e)}
                inputMode="numeric"
                maxLength={1}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`h-14 w-12 rounded-xl border bg-white/[0.03] text-center text-2xl font-semibold text-white transition-all focus:outline-none focus:ring-2 focus:ring-electric-400/40 ${
                  error ? 'border-rose-500/60' : d ? 'border-electric-400/60' : 'border-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        <Input
          label="New password"
          icon={Lock}
          type="password"
          placeholder="At least 8 characters"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          autoComplete="new-password"
          hint="Use 8+ characters."
        />
        <Input
          label="Confirm new password"
          icon={Lock}
          type="password"
          placeholder="Re-enter new password"
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          autoComplete="new-password"
          error={confirmPw && newPw && confirmPw !== newPw ? 'Does not match' : undefined}
        />

        {error && <p className="text-center text-sm text-rose-400">{error}</p>}

        <Button type="submit" size="lg" loading={loading} iconRight={ArrowRight} className="w-full">
          Update password
        </Button>

        <div className="flex items-center justify-center gap-2 text-sm text-slate-400">
          <ShieldCheck className="h-4 w-4 text-electric-400" />
          Didn't get a code?{' '}
          {cooldown > 0 ? (
            <span className="text-slate-500">Resend in {cooldown}s</span>
          ) : (
            <button type="button" onClick={resend} className="font-medium text-electric-300 hover:text-electric-200">
              Resend code
            </button>
          )}
        </div>
      </form>
    </AuthLayout>
  );
}
