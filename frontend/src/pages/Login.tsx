import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import GlassCard from '../components/GlassCard';
import Input from '../components/Input';
import Button from '../components/Button';

export const Login: React.FC = () => {
  const { login, error } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    
    if (!email || !password) {
      setValidationError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      // Error is set in AuthContext and can be displayed
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="p-8">
      <div className="flex flex-col gap-2 mb-8 text-left">
        <h3 className="text-2xl font-bold tracking-tight text-white font-outfit">Sign in</h3>
        <p className="text-sm text-slate-400">Enter your email address to access your dashboard</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {(validationError || error) && (
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
        />

        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex justify-between items-center w-full">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-outfit">
              Password
            </label>
            <Link 
              to="/forgot-password" 
              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password-input"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            icon={<Lock className="w-4.5 h-4.5" />}
          />
        </div>

        <Button type="submit" isLoading={loading}>
          Sign in
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-slate-400">
        Don't have an account?{' '}
        <Link 
          to="/register" 
          className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          Create one now
        </Link>
      </div>
    </GlassCard>
  );
};

export default Login;
