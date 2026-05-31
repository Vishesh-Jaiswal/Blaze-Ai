import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, ArrowRight } from 'lucide-react';
import AuthLayout from './AuthLayout';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { requestPasswordReset } from '@/services/authService';
import { useToast } from '@/store/toastStore';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await requestPasswordReset(email);
      toast.info(`Demo code: ${r.devCode}`, { duration: 8000, title: 'Reset code sent' });
      navigate('/reset-password', { state: { email } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your email and we'll send you a 6-digit reset code."
      footer={
        <Link to="/login" className="font-medium text-electric-300 hover:text-electric-200">
          ← Back to sign in
        </Link>
      }
    >
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
          Send reset code
        </Button>
      </form>
    </AuthLayout>
  );
}
