import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthLayout from './AuthLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { requestPasswordReset } from '@/services/authService';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={sent ? 'Check your inbox' : 'Reset your password'}
      subtitle={
        sent
          ? `We've sent a recovery link and a one-time code to ${email}.`
          : 'Enter your email and we’ll send you a verification code.'
      }
      footer={
        <Link to="/login" className="font-medium text-electric-300 hover:text-electric-200">
          ← Back to sign in
        </Link>
      }
    >
      {sent ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-5"
        >
          <div className="flex items-center gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <p className="text-sm text-slate-300">
              If an account exists, a reset link is on its way. Continue to enter your code.
            </p>
          </div>
          <Button size="lg" className="w-full" iconRight={ArrowRight} onClick={() => navigate('/verify-otp', { state: { email } })}>
            Enter verification code
          </Button>
        </motion.div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <Input
            label="Work email"
            icon={Mail}
            type="email"
            placeholder="you@hexaware.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            error={error}
          />
          <Button type="submit" size="lg" loading={loading} iconRight={ArrowRight} className="w-full">
            Send recovery code
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
