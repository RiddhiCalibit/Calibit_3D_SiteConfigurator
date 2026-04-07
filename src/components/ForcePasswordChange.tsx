import React, { useState } from 'react';
import { Lock, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { authFetch } from '../utils/api';
import { User } from '../types';

interface Props {
  user: User;
  onPasswordChanged: () => void;
}

export function ForcePasswordChange({ user, onPasswordChanged }: Props) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      return setError('Password must be at least 8 characters');
    }
    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      const res = await authFetch(`/api/users/${user.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          name: user.name,
          phone: user.phone,
          password: newPassword
        })
      });

      if (res.ok) {
        onPasswordChanged(); // proceed to the app
      } else {
        setError('Failed to update password. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-theme-bg text-theme-text flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-teal/10 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 relative z-10"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 bg-brand-teal/10 rounded-2xl mb-4">
            <ShieldCheck className="w-10 h-10 text-brand-teal" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Set New Password</h1>
          <p className="opacity-40 text-sm">
            You're using a temporary password. Please set a new one to continue.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-theme-card border border-theme-border p-8 rounded-3xl shadow-2xl space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs text-center">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest ml-1">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-white/5 border border-theme-border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
                placeholder="Min. 8 characters"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest ml-1">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20" />
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="w-full bg-white/5 border border-theme-border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
                placeholder="Repeat new password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-brand-teal hover:bg-brand-teal/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-teal/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Set New Password & Continue'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}