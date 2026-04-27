import React from 'react';
import { ArrowLeft, Mail, Phone, User, Building } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  onBack: () => void;
}

export function ContactAdmin({ onBack }: Props) {
  return (
    <div className="min-h-screen w-full bg-theme-bg text-theme-text flex items-center justify-center p-4 relative overflow-auto transition-colors duration-300">
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
            <User className="w-10 h-10 text-brand-teal" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Contact Administrator</h1>
          <p className="opacity-40 text-sm">Get in touch with your system administrator</p>
        </div>

        <div className="bg-theme-card backdrop-blur-xl border border-theme-border p-8 rounded-3xl shadow-2xl space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
              <div className="p-2 bg-brand-teal/10 rounded-lg">
                <User className="w-5 h-5 text-brand-teal" />
              </div>
              <div>
                <p className="text-sm font-medium">Administrator Name</p>
                <p className="text-xs opacity-60">Riddhi Shahir</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
              <div className="p-2 bg-brand-teal/10 rounded-lg">
                <Building className="w-5 h-5 text-brand-teal" />
              </div>
              <div>
                <p className="text-sm font-medium">Company</p>
                <p className="text-xs opacity-60">Calibit Systems Pvt. Ltd</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
              <div className="p-2 bg-brand-teal/10 rounded-lg">
                <Mail className="w-5 h-5 text-brand-teal" />
              </div>
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-xs opacity-60">info@calibitsystems.com</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
              <div className="p-2 bg-brand-teal/10 rounded-lg">
                <Phone className="w-5 h-5 text-brand-teal" />
              </div>
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p className="text-xs opacity-60">+91 9850959575</p>
              </div>
            </div>
          </div>

          <button
            onClick={onBack}
            className="w-full py-4 bg-white/5 hover:bg-white/10 text-theme-text font-medium rounded-xl transition-all flex items-center justify-center gap-2 group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Back to Login
          </button>
        </div>
      </motion.div>
    </div>
  );
}