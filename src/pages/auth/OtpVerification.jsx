import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthLayout from './AuthLayout';
import Button from '@/components/ui/Button';
import { requestOtp, verifyOtp } from '@/services/authService';
import { useToast } from '@/store/toastStore';

const LENGTH = 6;

export default function OtpVerification() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const email = location.state?.email || 'your email';

  const [digits, setDigits] = useState(Array(LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef([]);
  const sentRef = useRef(false);

  // Send an OTP on mount and surface the dev code via toast (demo only).
  // Guarded with a ref so React 18 strict-mode's double-invoke doesn't issue
  // (and overwrite) two codes back-to-back.
  useEffect(() => {
    if (sentRef.current) return;
    if (email && email !== 'your email') {
      sentRef.current = true;
      requestOtp(email).then((r) => {
        toast.info(`Demo code: ${r.devCode}`, { duration: 8000, title: 'OTP sent' });
        setCooldown(30);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    setLoading(true);
    setError('');
    try {
      await verifyOtp(email, code);
      toast.success('Verified! You can now sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    const r = await requestOtp(email);
    toast.info(`Demo code: ${r.devCode}`, { duration: 8000, title: 'New OTP sent' });
    setCooldown(30);
  };

  return (
    <AuthLayout
      title="Verify it's you"
      subtitle={`Enter the 6-digit code sent to ${email}.`}
      footer={
        <Link to="/login" className="font-medium text-electric-300 hover:text-electric-200">
          ← Back to sign in
        </Link>
      }
    >
      <form onSubmit={submit} className="space-y-6">
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

        {error && <p className="text-center text-sm text-rose-400">{error}</p>}

        <Button type="submit" size="lg" loading={loading} iconRight={ArrowRight} className="w-full">
          Verify & continue
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
