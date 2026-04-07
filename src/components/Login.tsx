import React, { useState } from 'react';
import { Box, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  onLogin: (email: string, password: string) => Promise<void>;
  onForgotPassword: () => void;
}

export function Login({ onLogin, onForgotPassword }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-theme-bg text-theme-text flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-teal/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8 relative z-10"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex p-4 bg-brand-teal/10 rounded-2xl mb-4">
            <Box className="w-10 h-10 text-brand-teal" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Site3D Enterprise</h1>
          <p className="opacity-40 text-sm">Sign in to your company workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-theme-card backdrop-blur-xl border border-theme-border p-8 rounded-3xl shadow-2xl space-y-6">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs font-medium text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20" />
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-theme-border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all"
                  placeholder="name@company.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20" />
                <input 
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-theme-border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-brand-teal hover:bg-brand-teal/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-teal/20 flex items-center justify-center gap-2 group disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Sign In
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <div className="text-center">
           <button
            type="button"
            onClick={onForgotPassword}
            className="text-xs text-brand-teal hover:underline">
            Forgot your password?
           </button>
          </div>

          <div className="pt-4 text-center">
            <p className="text-[10px] opacity-20 uppercase tracking-widest">
              Secured by 3D_Site_Configurator Auth
            </p>
          </div>
        </form>

        <div className="text-center">
          <p className="text-xs opacity-40">
            Don't have an account? <span className="text-brand-teal cursor-pointer hover:underline">Contact your administrator</span>
          </p>
        </div>
      </motion.div>
    </div>

    
  );
}
