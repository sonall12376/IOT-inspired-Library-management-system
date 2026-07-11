import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import GlassCard from '../components/GlassCard';
import Input from '../components/Input';
import Button from '../components/Button';

export const ResetPassword: React.FC = () => {
  const { resetPassword, error } = useAuth();
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setSuccess(false);

    if (!token) {
      setValidationError('Recovery token is missing. Please initiate a new recovery request.');
      return;
    }

    if (!password || !confirmPassword) {
      setValidationError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      // Handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="p-8">
      <div className="flex flex-col gap-2 mb-8 text-left">
        <h3 className="text-2xl font-bold tracking-tight text-white font-outfit">Set new password</h3>
        <p className="text-sm text-slate-400">Establish a secure password for your account access</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {success && (
          <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 text-left">
            Password updated successfully! Redirecting to login page...
          </div>
        )}

        {(validationError || error) && !success && (
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 text-left">
            {validationError || error}
          </div>
        )}

        <Input
          id="password-input"
          label="New Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock className="w-4.5 h-4.5" />}
          disabled={success}
        />

        <Input
          id="confirm-password-input"
          label="Confirm New Password"
          type="password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          icon={<Lock className="w-4.5 h-4.5" />}
          disabled={success}
        />

        <Button type="submit" isLoading={loading} disabled={success}>
          Update password
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-slate-400">
        Back to{' '}
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

export default ResetPassword;
