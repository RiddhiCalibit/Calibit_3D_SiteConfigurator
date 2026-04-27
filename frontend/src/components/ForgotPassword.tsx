// import React, { useState } from 'react';
// import { Mail, ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
// import { motion } from 'motion/react';

// interface Props {
//   onBack: () => void;
// }

// export function ForgotPassword({ onBack }: Props) {
//   const [email, setEmail] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [submitted, setSubmitted] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setLoading(true);
//     setError(null);

//     try {
//       const res = await fetch('/api/auth/forgot-password', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ email })
//       });

//       if (res.ok) {
//         setSubmitted(true);
//       } else {
//         setError('Something went wrong. Please try again.');
//       }
//     } catch {
//       setError('Something went wrong. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen w-full bg-theme-bg text-theme-text flex items-center justify-center p-4 relative overflow-hidden">
//       <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-teal/10 blur-[120px] rounded-full" />
//       <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />

//       <motion.div
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         className="w-full max-w-md space-y-8 relative z-10"
//       >
//         <button
//           onClick={onBack}
//           className="flex items-center gap-2 text-sm opacity-40 hover:opacity-100 transition-opacity"
//         >
//           <ArrowLeft className="w-4 h-4" />
//           Back to login
//         </button>

//         {!submitted ? (
//           <>
//             <div className="text-center space-y-2">
//               <h1 className="text-3xl font-bold tracking-tight">Forgot Password</h1>
//               <p className="opacity-40 text-sm">
//                 Enter your email and your admin will be notified to reset your password.
//               </p>
//             </div>

//             <form onSubmit={handleSubmit} className="bg-theme-card border border-theme-border p-8 rounded-3xl shadow-2xl space-y-6">
//               {error && (
//                 <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs text-center">
//                   {error}
//                 </div>
//               )}

//               <div className="space-y-2">
//                 <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest ml-1">
//                   Email Address
//                 </label>
//                 <div className="relative">
//                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20" />
//                   <input
//                     type="email"
//                     required
//                     value={email}
//                     onChange={e => setEmail(e.target.value)}
//                     className="w-full bg-white/5 border border-theme-border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
//                     placeholder="name@company.com"
//                   />
//                 </div>
//               </div>

//               <button
//                 type="submit"
//                 disabled={loading}
//                 className="w-full py-4 bg-brand-teal hover:bg-brand-teal/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-teal/20 flex items-center justify-center gap-2 disabled:opacity-50"
//               >
//                 {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Request'}
//               </button>
//             </form>
//           </>
//         ) : (
//           <motion.div
//             initial={{ opacity: 0, scale: 0.95 }}
//             animate={{ opacity: 1, scale: 1 }}
//             className="bg-theme-card border border-theme-border p-8 rounded-3xl shadow-2xl text-center space-y-4"
//           >
//             <div className="inline-flex p-4 bg-brand-teal/10 rounded-2xl">
//               <CheckCircle className="w-10 h-10 text-brand-teal" />
//             </div>
//             <h2 className="text-xl font-bold">Request Submitted</h2>
//             <p className="text-sm opacity-40 leading-relaxed">
//               Your admin has been notified. They will set a temporary password and share it with you. Use that to log in and you'll be asked to set a new password.
//             </p>
//             <button
//               onClick={onBack}
//               className="w-full py-3 bg-brand-teal text-white font-bold rounded-xl hover:bg-brand-teal/90 transition-all"
//             >
//               Back to Login
//             </button>
//           </motion.div>
//         )}
//       </motion.div>
//     </div>
//   );
// }

import React, { useState } from 'react';
import { Mail, ArrowLeft, Loader2, CheckCircle, KeyRound, ShieldCheck, Eye, EyeOff, RefreshCw, Copy, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Props {
  onBack: () => void;
}

type Step =
  | 'email'         // enter email
  | 'otp-display'   // OTP shown on screen (platform_admin only)
  | 'new-password'  // enter new password (platform_admin only)
  | 'submitted'     // request sent to admin (tenant_admin / sales_rep)
  | 'success';      // password changed successfully (platform_admin)

export function ForgotPassword({ onBack }: Props) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');   // OTP from server, shown in UI
  const [enteredOtp, setEnteredOtp] = useState('');       // OTP typed by user
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // ── Step 1: Submit email ─────────────────────────────────────────────────
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      if (data.requiresOtp) {
        setGeneratedOtp(data.otp);
        setEnteredOtp(data.otp); // pre-fill the input
        setStep('otp-display');
        startResendCooldown();
      } else {
        setStep('submitted');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ───────────────────────────────────────────────────────────
  const startResendCooldown = () => {
    setResendCooldown(60);
    const timer = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(timer); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok && data.otp) {
        setGeneratedOtp(data.otp);
        setEnteredOtp(data.otp);
        setCopied(false);
      }
      startResendCooldown();
    } catch {
      setError('Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyOtp = () => {
    navigator.clipboard.writeText(generatedOtp).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Step 2: Verify OTP + submit new password ─────────────────────────────
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (newPassword.length < 8) { setError('Password must be at least 8 characters.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/platform-reset-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: enteredOtp, new_password: newPassword }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStep('success');
      } else {
        setError(data.error || 'Verification failed. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const gradients = (
    <>
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-teal/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
    </>
  );

  return (
    <div className="min-h-screen w-full bg-theme-bg text-theme-text flex items-center justify-center p-4 relative overflow-hidden">
      {gradients}

      <AnimatePresence mode="wait">

        {/* ── Step 1: Email ─────────────────────────────────────────────── */}
        {step === 'email' && (
          <motion.div key="email" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md space-y-8 relative z-10">

            <button onClick={onBack} className="flex items-center gap-2 text-sm opacity-40 hover:opacity-100 transition-opacity">
              <ArrowLeft className="w-4 h-4" /> Back to login
            </button>

            <div className="text-center space-y-2">
              <div className="inline-flex p-4 bg-brand-teal/10 rounded-2xl mb-2">
                <KeyRound className="w-8 h-8 text-brand-teal" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Forgot Password</h1>
              <p className="opacity-40 text-sm">Enter your email to begin the reset process.</p>
            </div>

            <form onSubmit={handleEmailSubmit} className="bg-theme-card border border-theme-border p-8 rounded-3xl shadow-2xl space-y-6">
              {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center">{error}</div>}
              <div className="space-y-2">
                <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 opacity-20" />
                  <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full bg-white/5 border border-theme-border rounded-xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
                    placeholder="name@company.com" />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-4 bg-brand-teal hover:bg-brand-teal/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-teal/20 flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
              </button>
            </form>
          </motion.div>
        )}

        {/* ── Step 2a: OTP Display (Platform Admin) ─────────────────────── */}
        {step === 'otp-display' && (
          <motion.div key="otp-display" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md space-y-6 relative z-10">

            <button onClick={() => { setStep('email'); setError(null); }}
              className="flex items-center gap-2 text-sm opacity-40 hover:opacity-100 transition-opacity">
              <ArrowLeft className="w-4 h-4" /> Change email
            </button>

            <div className="text-center space-y-2">
              <div className="inline-flex p-4 bg-amber-500/10 rounded-2xl mb-2">
                <ShieldCheck className="w-8 h-8 text-amber-400" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Your Reset OTP</h1>
              <p className="opacity-40 text-sm">Use this code to verify your identity and set a new password.</p>
            </div>

            <div className="bg-theme-card border border-theme-border rounded-3xl shadow-2xl overflow-hidden">
              {/* OTP display banner */}
              <div className="bg-amber-500/10 border-b border-amber-500/20 p-6 text-center space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">One-Time Password</p>
                <div className="flex items-center justify-center gap-4">
                  <span className="text-5xl font-mono font-bold tracking-[0.3em] text-amber-300 select-all">
                    {generatedOtp}
                  </span>
                  <button onClick={handleCopyOtp}
                    className="p-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 transition-all"
                    title="Copy OTP">
                    {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-[10px] text-amber-400/60">Valid for 10 minutes · {email}</p>
                <button onClick={handleResendOtp} disabled={resendCooldown > 0 || loading}
                  className="flex items-center gap-1.5 text-xs text-amber-400 disabled:opacity-30 hover:underline disabled:no-underline transition-opacity mx-auto">
                  <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Generate new OTP'}
                </button>
              </div>

              {/* Proceed button */}
              <div className="p-6">
                <p className="text-xs opacity-40 text-center mb-4">
                  Copy the OTP above, then proceed to set your new password.
                </p>
                <button onClick={() => { setError(null); setStep('new-password'); }}
                  className="w-full py-4 bg-brand-teal hover:bg-brand-teal/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-teal/20">
                  Proceed to Reset Password →
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Step 2b: Enter OTP + New Password (Platform Admin) ────────── */}
        {step === 'new-password' && (
          <motion.div key="new-password" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="w-full max-w-md space-y-6 relative z-10">

            <button onClick={() => { setStep('otp-display'); setError(null); }}
              className="flex items-center gap-2 text-sm opacity-40 hover:opacity-100 transition-opacity">
              <ArrowLeft className="w-4 h-4" /> Back to OTP
            </button>

            <div className="text-center space-y-2">
              <div className="inline-flex p-4 bg-brand-teal/10 rounded-2xl mb-2">
                <KeyRound className="w-8 h-8 text-brand-teal" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Set New Password</h1>
              <p className="opacity-40 text-sm">Confirm your OTP and choose a new password.</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="bg-theme-card border border-theme-border p-8 rounded-3xl shadow-2xl space-y-5">
              {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center">{error}</div>}

              {/* OTP confirm field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest ml-1">OTP Code</label>
                  <button type="button" onClick={() => setStep('otp-display')}
                    className="text-[10px] text-brand-teal hover:underline opacity-70">View OTP again</button>
                </div>
                <input type="text" required maxLength={6}
                  value={enteredOtp}
                  onChange={e => setEnteredOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-white/5 border border-theme-border rounded-xl py-3 px-4 text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                  placeholder="000000" />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-theme-border" />
                <span className="text-[10px] opacity-30 uppercase tracking-widest">New Password</span>
                <div className="flex-1 h-px bg-theme-border" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest ml-1">New Password</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required
                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    className="w-full bg-white/5 border border-theme-border rounded-xl py-3 pl-4 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
                    placeholder="Min. 8 characters" />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-30 hover:opacity-70 transition-opacity">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold opacity-40 uppercase tracking-widest ml-1">Confirm Password</label>
                <input type={showPassword ? 'text' : 'password'} required
                  value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full bg-white/5 border border-theme-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
                  placeholder="Re-enter new password" />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-[10px] text-red-400 ml-1">Passwords do not match</p>
                )}
              </div>

              <button type="submit"
                disabled={loading || enteredOtp.length < 6 || !newPassword || !confirmPassword}
                className="w-full py-4 bg-brand-teal hover:bg-brand-teal/90 text-white font-bold rounded-xl transition-all shadow-lg shadow-brand-teal/20 flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password'}
              </button>
            </form>
          </motion.div>
        )}

        {/* ── Step 3: Submitted (Tenant Admin / Sales Rep) ──────────────── */}
        {step === 'submitted' && (
          <motion.div key="submitted" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md relative z-10">
            <div className="bg-theme-card border border-theme-border p-10 rounded-3xl shadow-2xl text-center space-y-5">
              <div className="inline-flex p-4 bg-brand-teal/10 rounded-2xl">
                <CheckCircle className="w-10 h-10 text-brand-teal" />
              </div>
              <h2 className="text-xl font-bold">Request Submitted</h2>
              <p className="text-sm opacity-40 leading-relaxed">
                Your administrator has been notified. They will set a temporary password and share it with you.
                Use that to log in — you'll be prompted to set a new password immediately.
              </p>
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-xs text-left space-y-1">
                <p className="font-bold uppercase tracking-widest text-[10px] mb-1">What happens next</p>
                <p>Your admin will receive your reset request and set a temporary password for you to use.</p>
              </div>
              <button onClick={onBack} className="w-full py-3 bg-brand-teal text-white font-bold rounded-xl hover:bg-brand-teal/90 transition-all">
                Back to Login
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 4: Success (Platform Admin) ─────────────────────────── */}
        {step === 'success' && (
          <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md relative z-10">
            <div className="bg-theme-card border border-theme-border p-10 rounded-3xl shadow-2xl text-center space-y-5">
              <div className="inline-flex p-4 bg-emerald-500/10 rounded-2xl">
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold">Password Reset Successfully</h2>
              <p className="text-sm opacity-40 leading-relaxed">
                Your new password has been set. You can now sign in with your new credentials.
              </p>
              <button onClick={onBack} className="w-full py-3 bg-brand-teal text-white font-bold rounded-xl hover:bg-brand-teal/90 transition-all">
                Sign In
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}