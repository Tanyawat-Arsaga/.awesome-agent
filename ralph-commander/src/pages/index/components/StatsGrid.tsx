import React from 'react';
import { motion } from 'framer-motion';
import { useRalphStore } from '../../../renderer/store/useRalphStore';

const InfoTooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-2">
    <div 
      className="cursor-help text-slate-300 dark:text-slate-600 hover:text-slate-500 transition-colors"
      aria-haspopup="true"
      aria-label="Informational tooltip"
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
    </div>
    <div 
      role="tooltip"
      className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 hidden group-hover:block w-48 p-3 bg-slate-900 dark:bg-black text-white text-[9px] font-bold rounded-xl shadow-2xl z-[100] border border-white/10 backdrop-blur-xl transition-all"
    >
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-900 dark:border-t-black"></div>
    </div>
  </div>
);

export function StatsGrid() {
  const status = useRalphStore(state => state.status);
  const [elapsed, setElapsed] = React.useState<string>('00:00:00');

  React.useEffect(() => {
    if (!status?.active || !status?.started_at) return;

    const interval = setInterval(() => {
      const start = new Date(status.started_at).getTime();
      const now = Date.now();
      const diff = Math.max(0, now - start);
      
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      
      setElapsed(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [status?.active, status?.started_at]);

  if (!status) return null;

  const totalTokens = status.stats?.models ? Object.values(status.stats.models).reduce((acc: number, m: any) => acc + (m.tokens?.total || 0), 0) : 0;
  const inputTokens = status.stats?.models ? Object.values(status.stats.models).reduce((acc: number, m: any) => acc + (m.tokens?.input || 0), 0) : 0;
  const outputTokens = status.stats?.models ? Object.values(status.stats.models).reduce((acc: number, m: any) => acc + (m.tokens?.candidates || 0), 0) : 0;
  
  // Very rough cost estimation: $0.10 per 1M tokens avg
  const estimatedCost = (totalTokens / 1000000) * 0.10;

  const avgTimePerIteration = status.iteration > 0 ? (() => {
      const start = new Date(status.started_at).getTime();
      const now = status.active ? Date.now() : start;
      const diff = Math.max(0, now - start);
      return Math.round(diff / status.iteration / 1000);
  })() : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
      <motion.div 
        whileHover={{ y: -5 }}
        className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-white dark:border-white/5"
      >
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center">
            Iteration
            <InfoTooltip text="Current turn in the autonomous loop compared to the maximum allowed iterations." />
        </label>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">{status.iteration}</span>
          <span className="text-sm text-slate-400 font-bold opacity-50">/ {status.max_iterations}</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-2 mt-4 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min((status.iteration / (status.max_iterations || 1)) * 100, 100)}%` }}
            className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-neon-blue dark:to-blue-600 h-full rounded-full shadow-[0_0_10px_rgba(0,242,255,0.3)]"
            transition={{ duration: 1.5, ease: "circOut" }}
          />
        </div>
      </motion.div>

      <motion.div 
        whileHover={{ y: -5 }}
        className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-white dark:border-white/5"
      >
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center">
            Progress
            <InfoTooltip text="Aggregate completion percentage of tasks defined in the active blueprint (@fix_plan.md)." />
        </label>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black text-emerald-600 dark:text-neon-green tabular-nums">
            {useRalphStore.getState().tasks.length > 0 
              ? Math.round((useRalphStore.getState().tasks.filter(t => t.completed).length / useRalphStore.getState().tasks.length) * 100)
              : 0}%
          </span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-2 mt-4 overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ 
                width: `${useRalphStore.getState().tasks.length > 0 
                  ? (useRalphStore.getState().tasks.filter(t => t.completed).length / useRalphStore.getState().tasks.length) * 100
                  : 0}%` 
            }}
            className="bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-neon-green dark:to-emerald-600 h-full rounded-full shadow-[0_0_10px_rgba(57,255,20,0.3)]"
            transition={{ duration: 1.5, ease: "circOut" }}
          />
        </div>
      </motion.div>

      <motion.div 
        whileHover={{ y: -5 }}
        className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-white dark:border-white/5"
      >
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center">
            Intelligence
            <InfoTooltip text="Real-time LLM token consumption and estimated operational cost." />
        </label>
        <div className="text-3xl font-black text-indigo-600 dark:text-neon-purple tabular-nums">
          {totalTokens > 1000 ? (totalTokens / 1000).toFixed(1) + 'k' : totalTokens}
        </div>
        <div className="mt-2 flex items-center justify-between">
            <span className="text-[9px] font-bold text-slate-400 opacity-60 italic">${estimatedCost.toFixed(4)} est.</span>
            <div className="flex gap-2">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">I:{inputTokens > 1000 ? (inputTokens / 1000).toFixed(0) + 'k' : inputTokens}</span>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">O:{outputTokens > 1000 ? (outputTokens / 1000).toFixed(0) + 'k' : outputTokens}</span>
            </div>
        </div>
      </motion.div>

      <motion.div 
        whileHover={{ y: -5 }}
        className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-white dark:border-white/5"
      >
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center">
            Velocity
            <InfoTooltip text="Average time duration per iteration turn. Lower is faster." />
        </label>
        <div className="text-3xl font-black text-slate-800 dark:text-white tabular-nums h-10">
          {elapsed}
        </div>
        <p className="text-[9px] font-bold text-slate-400 mt-2 italic opacity-60">
            Avg. {status.stats?.avg_iteration_ms ? (status.stats.avg_iteration_ms / 1000).toFixed(1) : avgTimePerIteration}s / turn
        </p>
      </motion.div>

      <motion.div 
        whileHover={{ y: -5 }}
        className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-white dark:border-white/5"
      >
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center">
            Density
            <InfoTooltip text="Visual representation of LLM inquiries per iteration over the last 24 turns." />
        </label>
        <div className="flex flex-wrap gap-1 mt-1">
          {(status.stats?.iteration_history || []).slice(-24).map((h, i) => (
            <div 
              key={i}
              className={`w-2.5 h-2.5 rounded-sm ${
                (h as any).queries > 3 ? 'bg-indigo-600' : 
                (h as any).queries > 1 ? 'bg-indigo-400' : 
                'bg-indigo-100 dark:bg-indigo-900/30'
              }`}
            />
          ))}
          {(!status.stats?.iteration_history || status.stats.iteration_history.length === 0) && (
              <div className="text-[10px] text-slate-400 font-bold italic">No history yet</div>
          )}
        </div>
        <div className="mt-3 flex items-center justify-between">
            <span className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-tighter">Heatmap</span>
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
        </div>
      </motion.div>

      <motion.div 
        whileHover={{ y: -5 }}
        className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-white dark:border-white/5 overflow-hidden"
      >
        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3 flex items-center">
            Engine
            <InfoTooltip text="The active Large Language Model and agent framework powering this cycle." />
        </label>
        <div className="text-sm font-black text-slate-800 dark:text-slate-200 truncate group-hover:text-blue-500 transition-colors">
          {status.model || 'auto'}
        </div>
        <div className="mt-2 inline-flex px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded-md">
            <span className="text-[9px] text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">{status.agent}</span>
        </div>
      </motion.div>
    </div>
  );
}
