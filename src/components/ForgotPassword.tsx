import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  onBack: () => void;
}

export function ForgotPassword({ onBack }: Props) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        setError('Something went wrong. Please try again.');
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
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 relative z-10"
      >
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm opacity-40 hover:opacity-100 transition-opacity"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to login
        </button>

        {!submitted ? (
          <>
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Forgot Password</h1>
              <p className="opacity-40 text-sm">
                Enter your email and your admin will be notified to reset your password.
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
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-theme-border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
                    placeholder="name@company.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-brand-teal hover:bg-brand-teal/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-teal/20 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Request'}
              </button>
            </form>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-theme-card border border-theme-border p-8 rounded-3xl shadow-2xl text-center space-y-4"
          >
            <div className="inline-flex p-4 bg-brand-teal/10 rounded-2xl">
              <CheckCircle className="w-10 h-10 text-brand-teal" />
            </div>
            <h2 className="text-xl font-bold">Request Submitted</h2>
            <p className="text-sm opacity-40 leading-relaxed">
              Your admin has been notified. They will set a temporary password and share it with you. Use that to log in and you'll be asked to set a new password.
            </p>
            <button
              onClick={onBack}
              className="w-full py-3 bg-brand-teal text-white font-bold rounded-xl hover:bg-brand-teal/90 transition-all"
            >
              Back to Login
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}