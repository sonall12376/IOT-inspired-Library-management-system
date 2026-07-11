import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import GlassCard from '../components/GlassCard';
import Input from '../components/Input';
import Button from '../components/Button';

export const Register: React.FC = () => {
  const { register, error } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');
    setSuccess(false);
    
    if (!name || !email || !password) {
      setValidationError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register(name, email, password);
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      // Error is set in AuthContext and can be displayed
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassCard className="p-8">
      <div className="flex flex-col gap-2 mb-8 text-left">
        <h3 className="text-2xl font-bold tracking-tight text-white font-outfit">Create an account</h3>
        <p className="text-sm text-slate-400">Join SmartLibrary AI to manage your study sessions</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {success && (
          <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 text-left">
            Registration successful! Redirecting to login...
          </div>
        )}

        {(validationError || error) && !success && (
          <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-400 text-left">
            {validationError || error}
          </div>
        )}

        <Input
          id="name-input"
          label="Full Name"
          type="text"
          placeholder="Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          icon={<User className="w-4.5 h-4.5" />}
        />

        <Input
          id="email-input"
          label="Email Address"
          type="email"
          placeholder="jane.doe@university.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          icon={<Mail className="w-4.5 h-4.5" />}
        />

        <Input
          id="password-input"
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          icon={<Lock className="w-4.5 h-4.5" />}
        />

        <Button type="submit" isLoading={loading}>
          Create account
        </Button>
      </form>

      <div className="mt-8 text-center text-sm text-slate-400">
        Already have an account?{' '}
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

export default Register;
