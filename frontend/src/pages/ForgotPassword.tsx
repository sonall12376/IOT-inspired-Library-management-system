import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import GlassCard from '../components/GlassCard';
import Input from '../components/Input';
import Button from '../components/Button';

export const ForgotPassword: React.FC = () => {
  const { forgotPassword, error } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [success, setSuccess] = useState(false);
  const [devResetToken, setDevResetToken] = useState<string | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setSuccess(false);
    setDevResetToken(undefined);
    
    if (!email) {
      setValidationError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      const resetToken = await forgotPassword(email);
      setSuccess(true);
      if (resetToken) {
        setDevResetToken(resetToken);
      }
    } catch (err) {
      // Handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="p-8">
      <div className="flex flex-col gap-2 mb-8 text-left">
        <h3 className="text-2xl font-bold tracking-tight text-white font-outfit">Reset password</h3>
        <p className="text-sm text-slate-400">Enter your email and we'll log/send recovery instructions</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {success && (
          <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 text-left flex flex-col gap-2">
            <span>Instructions have been dispatched successfully.</span>
            {devResetToken && (
              <div className="mt-2 pt-2 border-t border-emerald-500/20">
                <p className="font-semibold text-slate-200">Developer Testing Assistance Mode:</p>
                <p className="font-mono bg-slate-900/60 p-2 rounded text-slate-300 mt-1 select-all break-all text-[11px] leading-normal">{devResetToken}</p>
                <Link 
                  to={`/reset-password/${devResetToken}`} 
                  className="inline-block mt-2.5 text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors underline"
                >
                  Proceed to Reset Screen &rarr;
                </Link>
              </div>
            )}
          </div>
        )}

        {(validationError || error) && !success && (
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 text-left">
            {validationError || error}
          </div>
        )}

        <Input
          id="email-input"
          label="Email Address"
          type="email"
          placeholder="you@university.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="w-4.5 h-4.5" />}
          disabled={success}
        />

        <Button type="submit" isLoading={loading} disabled={success}>
          Send recovery token
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-slate-400">
        Remember your password?{' '}
        <Link 
          to="/login" 
          className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          Sign in
        </Link>
      </div>
    </GlassCard>
  );
};

export default ForgotPassword;
