import React, { useState, useEffect } from 'react';
import { AppState } from '../../../backend/types';
import { runComplianceCheck, ComplianceReport, ComplianceResult } from '../services/complianceService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldQuestion, 
  RefreshCw, 
  ChevronRight, 
  AlertCircle,
  CheckCircle2,
  Info,
  ArrowRight
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { clsx } from 'clsx';
import Markdown from 'react-markdown';

interface Props {
  state: AppState;
  isOpen: boolean;
  onClose: () => void;
}

export function CompliancePanel({ state, isOpen, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunCheck = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await runComplianceCheck(state);
      setReport(result);
    } catch (err) {
      setError("Failed to run compliance check. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && !report && !loading) {
      handleRunCheck();
    }
  }, [isOpen]);

  const chartData = report ? [
    { name: 'Score', value: report.overallScore },
    { name: 'Remaining', value: 100 - report.overallScore }
  ] : [];

  const COLORS = ['#10b981', '#1e293b']; // Emerald and Slate-800

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="absolute top-0 right-0 w-[400px] h-full bg-brand-navy/95 backdrop-blur-xl border-l border-white/10 z-[60] flex flex-col shadow-2xl"
    >
      {/* Header */}
      <div className="p-6 border-bottom border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-widest">Compliance Engine</h2>
            <p className="text-[10px] text-white/40 font-mono">AI-POWERED RISK ASSESSMENT</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <RefreshCw className="w-8 h-8 text-emerald-500" />
            </motion.div>
            <p className="text-xs text-white/60 font-medium animate-pulse">Analyzing site configuration...</p>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-red-500">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-bold uppercase">Analysis Error</span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">{error}</p>
            <button 
              onClick={handleRunCheck}
              className="w-full py-2 bg-red-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-red-600 transition-colors"
            >
              Retry Analysis
            </button>
          </div>
        ) : report ? (
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Score Gauge */}
              <div className="relative h-48 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      startAngle={180}
                      endAngle={0}
                      paddingAngle={0}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pt-8">
                  <span className="text-4xl font-bold text-white leading-none">{report.overallScore}</span>
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">Safety Score</span>
                </div>
              </div>

              {/* Summary */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Executive Summary</h3>
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-xs text-white/80 leading-relaxed italic">
                    "{report.summary}"
                  </p>
                </div>
              </div>

              {/* Checks List */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Checklist Results</h3>
                <div className="space-y-3">
                  {report.checks.map((check, idx) => (
                    <div 
                      key={idx}
                      className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2 group hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">{check.category}</span>
                        <StatusBadge status={check.status} />
                      </div>
                      <p className="text-xs text-white font-medium">{check.message}</p>
                      {check.details && (
                        <p className="text-[10px] text-white/40 leading-relaxed">{check.details}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-4 pb-8">
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Recommendations</h3>
                <div className="space-y-2">
                  {report.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                      <p className="text-xs text-white/80 leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : (
          <div className="h-full flex flex-col items-center justify-center space-y-6 text-center">
            <div className="p-6 bg-white/5 rounded-full">
              <ShieldQuestion className="w-12 h-12 text-white/20" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-white">Ready for Analysis</h3>
              <p className="text-xs text-white/40 leading-relaxed max-w-[240px]">
                Run the AI compliance engine to verify safety distances, capacity, and operational standards.
              </p>
            </div>
            <button 
              onClick={handleRunCheck}
              className="px-8 py-3 bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              Run Compliance Check
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-white/10 bg-brand-navy/50">
        <button 
          onClick={handleRunCheck}
          disabled={loading}
          className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={clsx("w-3.5 h-3.5", loading && "animate-spin")} />
          Refresh Report
        </button>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: ComplianceResult['status'] }) {
  switch (status) {
    case 'pass':
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/20 text-emerald-500 rounded-full">
          <CheckCircle2 className="w-3 h-3" />
          <span className="text-[9px] font-bold uppercase">Pass</span>
        </div>
      );
    case 'fail':
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/20 text-red-500 rounded-full">
          <AlertCircle className="w-3 h-3" />
          <span className="text-[9px] font-bold uppercase">Fail</span>
        </div>
      );
    case 'warning':
      return (
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-amber-500/20 text-amber-500 rounded-full">
          <Info className="w-3 h-3" />
          <span className="text-[9px] font-bold uppercase">Warning</span>
        </div>
      );
  }
}
