import React, { useEffect, useState, useCallback } from 'react';
import { useRalphStore } from '../../renderer/store/useRalphStore';
import { useRalphWS } from '../../renderer/hooks/useRalphWS';
import { StatsGrid } from './components/StatsGrid';
import { LogViewer } from './components/LogViewer';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Power, RefreshCcw, FileCode, CheckCircle2, Moon, Sun } from 'lucide-react';

export default function Page() {
  // 1. Unified State Management
  const { connected: wsConnected } = useRalphWS();
  const { 
    status, setStatus, 
    logs, setLogs, 
    tasks, setTasks, 
    changedFiles, setChangedFiles 
  } = useRalphStore();

  // 2. Form State (Keeping local as it's UI-only)
  const [prompt, setPrompt] = useState('');
  const [maxIterations, setMaxIterations] = useState(20);
  const [completionPromise, setCompletionPromise] = useState('DONE');
  const [agent, setAgent] = useState('gemini');
  const [model, setModel] = useState('auto');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [resume, setResume] = useState(false);
  const [isDark, setIsDark] = useState(false);

  // 3. Data Fetching Logic
  const fetchModels = async () => {
    try {
      const res = await fetch('/api/agent/models');
      const data = await res.json();
      if (data.success) {
        const aliases = ['auto', 'pro', 'flash', 'flash-lite'];
        setAvailableModels(data.models.filter((m: string) => !aliases.includes(m)));
      }
    } catch {}
  };

  const syncState = async () => {
    try {
      const [sRes, lRes, tRes, fRes] = await Promise.all([
        fetch('/api/ralph/status'),
        fetch('/api/ralph/logs'),
        fetch('/api/ralph/tasks'),
        fetch('/api/ralph/files')
      ]);
      setStatus(await sRes.json());
      setLogs(await lRes.text());
      setTasks(await tRes.json());
      setChangedFiles(await fRes.json());
    } catch (e) {
      console.error("Sync failed", e);
    }
  };

  const handleStop = async () => {
    if (!confirm('Stop the autonomous lifecycle?')) return;
    await fetch('/api/ralph/stop', { method: 'POST' });
    syncState();
  };

  const handleStart = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!resume && !confirm('Engage agent with a new mission?')) return;
    
    const res = await fetch('/api/ralph/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, max_iterations: maxIterations, completion_promise: completionPromise, agent, model, resume })
    });
    if (res.ok) { 
      setPrompt(''); 
      setResume(false); 
      syncState(); 
    }
  };

  const handleClearLogs = async () => {
    await fetch('/api/ralph/logs', { method: 'DELETE' });
    setLogs('');
  };

  const handleToggleTheme = useCallback(() => {
    const newDark = !isDark;
    setIsDark(newDark);
    if (newDark) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDark]);

  // 4. Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        if (!status?.active) handleStart();
      }
      if (e.key === 'Escape') {
        if (status?.active) handleStop();
      }
      if (e.key === 'l' && e.altKey) {
        handleClearLogs();
      }
      if (e.key === 'd' && e.altKey) {
        handleToggleTheme();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status?.active, prompt, resume, handleToggleTheme]);

  const handleToggleTask = async (description: string, completed: boolean) => {
    await fetch('/api/ralph/tasks/toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description, completed })
    });
    // Optimistic update
    setTasks(tasks.map(t => t.description === description ? { ...t, completed } : t));
  };

  // 4. Initial Setup & Polling Fallback
  useEffect(() => {
    fetchModels();
    syncState();
    // Low-frequency polling fallback if WS fails or for periodic cleanup
    const interval = setInterval(syncState, 10000);
    return () => clearInterval(interval);
  }, []);

  if (!status) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] text-slate-400 font-medium">
        <motion.div 
          animate={{ opacity: [0.5, 1, 0.5] }} 
          transition={{ duration: 2, repeat: Infinity }}
          className="flex flex-col items-center gap-6"
        >
          <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
          <p className="font-black uppercase tracking-[0.4em] text-[10px]">Neural Initialization</p>
        </motion.div>
      </div>
    );
  }

  // 5. Group tasks by phase
  const groupedTasks = tasks.reduce((acc, t) => {
    const p = t.phase || "Uncategorized";
    if (!acc[p]) acc[p] = [];
    acc[p].push(t);
    return acc;
  }, {} as Record<string, typeof tasks>);

  const completedTasksCount = tasks.filter(t => t.completed).length;
  const totalTasksCount = tasks.length;
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;
  const firstIncompleteTask = tasks.find(t => !t.completed);

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-dark-bg text-slate-900 dark:text-slate-100 font-sans p-8 sm:p-12 selection:bg-blue-100 selection:text-blue-900 transition-colors duration-500">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header Section */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-12">
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-5xl font-black tracking-tighter text-slate-900 dark:text-white flex items-center gap-4">
                <span className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20 rotate-3">RC</span>
                Ralph Commander
              </h1>
              <div className="flex gap-6 mt-3 items-center ml-1">
                <p className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">Autonomous Agent Orchestrator</p>
                <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${wsConnected ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800'}`}>
                  {wsConnected ? 'Uplink Stable' : 'Uplink Lost'}
                </div>
              </div>
            </div>

            <div className="h-12 w-px bg-slate-200 dark:bg-white/10 hidden xl:block"></div>

            <div className="hidden xl:flex gap-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Engine</span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter">{status.agent}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Model</span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter">{status.model}</span>
              </div>
              {status.active && status.completion_promise && (
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Promise</span>
                  <span className="text-sm font-black text-blue-600 dark:text-neon-blue uppercase tracking-tighter">{status.completion_promise}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={handleToggleTheme}
              className="p-3 bg-white dark:bg-dark-card text-slate-400 hover:text-blue-500 dark:text-slate-500 dark:hover:text-neon-blue rounded-2xl border border-slate-100 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-black/20 transition-all"
            >
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <AnimatePresence>
              {status.is_zombie && status.active && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="px-6 py-2 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-2 border-rose-200 dark:border-rose-800 rounded-2xl text-xs font-black uppercase tracking-[0.2em] flex items-center gap-3 animate-pulse"
                >
                  <Power size={14} />
                  Zombie Loop Detected
                </motion.div>
              )}
              {status.active && (
                <motion.div 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-500/30 flex items-center gap-3"
                >
                  <RefreshCcw size={14} className="animate-spin" />
                  {status.phase}
                </motion.div>
              )}
            </AnimatePresence>
            <div className={`px-6 py-2 rounded-2xl text-xs font-black uppercase tracking-[0.2em] border-2 ${status.active ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-white/10'}`}>
              {status.active ? 'Active' : 'Standby'}
            </div>
            {status.active && (
              <button 
                onClick={handleStop} 
                className="group relative px-8 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-rose-500/20 hover:shadow-rose-500/40 active:scale-95"
              >
                <Power size={14} className="inline mr-2 group-hover:rotate-90 transition-transform" />
                Kill Agent
              </button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-12">
            
            {/* Deployment Console */}
            <AnimatePresence>
              {!status.active && (
                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white dark:bg-dark-card rounded-[3rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/20 border border-white dark:border-white/5 p-10 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                    <Rocket size={200} />
                  </div>
                  
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center">
                      <Rocket size={20} />
                    </div>
                    Deploy Mission
                  </h3>

                  <form onSubmit={handleStart} className="space-y-8 relative z-10">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Mission Parameters</label>
                      <textarea 
                        value={prompt} 
                        onChange={e => setPrompt(e.target.value)} 
                        placeholder="What is the objective of this lifecycle?" 
                        required 
                        className="w-full h-40 px-8 py-6 bg-slate-50 dark:bg-dark-bg border-2 border-slate-100 dark:border-white/5 rounded-[2rem] focus:border-blue-500 dark:focus:border-neon-blue focus:bg-white dark:focus:bg-dark-card transition-all outline-none resize-none text-lg font-bold text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-700"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Turn Limit</label>
                        <input 
                          type="number" 
                          value={maxIterations} 
                          onChange={e => setMaxIterations(parseInt(e.target.value))} 
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-dark-bg border-2 border-slate-100 dark:border-white/5 rounded-2xl focus:border-blue-500 dark:focus:border-neon-blue outline-none font-black text-slate-700 dark:text-slate-200 text-center"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Agent Engine</label>
                        <select 
                          value={agent} 
                          onChange={e => setAgent(e.target.value)} 
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-dark-bg border-2 border-slate-100 dark:border-white/5 rounded-2xl focus:border-blue-500 dark:focus:border-neon-blue outline-none bg-white dark:bg-dark-card font-black text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                        >
                          <option value="gemini">Gemini CLI</option>
                          <option value="claude">Claude Code</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Neural Model</label>
                        <select 
                          value={model} 
                          onChange={e => setModel(e.target.value)} 
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-dark-bg border-2 border-slate-100 dark:border-white/5 rounded-2xl focus:border-blue-500 dark:focus:border-neon-blue outline-none bg-white dark:bg-dark-card font-black text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                        >
                          <optgroup label="Core Aliases">
                            <option value="auto">auto (Standard)</option>
                            <option value="pro">pro (Reasoning)</option>
                            <option value="flash">flash (Speed)</option>
                          </optgroup>
                          {availableModels.length > 0 && (
                            <optgroup label="Concrete Units">
                              {availableModels.map(m => <option key={m} value={m}>{m}</option>)}
                            </optgroup>
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-between items-center px-4">
                      <label className="flex items-center gap-4 cursor-pointer group">
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${resume ? 'bg-blue-600 dark:bg-neon-blue' : 'bg-slate-200 dark:bg-white/10'}`}>
                          <div className={`bg-white w-4 h-4 rounded-full transition-transform ${resume ? 'translate-x-6' : ''}`} />
                        </div>
                        <input type="checkbox" className="hidden" checked={resume} onChange={e => setResume(e.target.checked)} />
                        <span className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest group-hover:text-blue-600 dark:group-hover:text-neon-blue transition-colors">Resume Existing Blueprint</span>
                      </label>
                      
                      <button 
                        type="submit" 
                        className="px-12 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 dark:from-blue-700 dark:to-indigo-900 text-white rounded-[2rem] font-black text-lg transition-all shadow-2xl shadow-blue-500/40 hover:shadow-blue-500/60 active:scale-[0.98] flex items-center gap-4"
                      >
                        Engage Agent
                        <Rocket size={20} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </button>
                    </div>
                  </form>
                </motion.section>
              )}
            </AnimatePresence>

            {/* Performance Telemetry */}
            <StatsGrid />

            {/* Git Inventory */}
            <AnimatePresence>
              {changedFiles.length > 0 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  className="bg-white/40 dark:bg-dark-card/40 backdrop-blur-sm rounded-[3rem] border border-white dark:border-white/5 p-8"
                >
                  <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                      <FileCode size={14} className="text-blue-500 dark:text-neon-blue" />
                      WIP Filesystem Diffs
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {changedFiles.map((file, idx) => (
                      <div key={idx} className="group px-4 py-2 bg-slate-900 text-white rounded-2xl text-[10px] font-bold flex items-center gap-3 shadow-lg shadow-slate-900/10 hover:scale-105 transition-transform cursor-default border border-white/5">
                        <span className={`w-2 h-2 rounded-full ${file.status === 'M' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'}`}></span>
                        <span className="opacity-40 font-black tracking-widest">{file.status}</span>
                        <span className="text-slate-300">{file.path}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Terminal Module */}
            <div className="h-[750px]">
              <LogViewer logs={logs} onClear={handleClearLogs} />
            </div>
          </div>

          {/* Blueprint Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            <section className="bg-white dark:bg-dark-card rounded-[3rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/20 border border-white dark:border-white/5 p-10 sticky top-12 max-h-[calc(100vh-6rem)] overflow-hidden flex flex-col transition-all hover:shadow-slate-300/50 dark:hover:shadow-black/40">
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-4">
                  <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center">
                    <CheckCircle2 size={20} />
                  </div>
                  Lifecycle Blueprint
                </h3>
              </div>

              <div className="mb-8 flex-shrink-0">
                <div className="flex justify-between text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-2">
                  <span>Progress</span>
                  <span>{completedTasksCount} / {totalTasksCount} ({progressPercent}%)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-2 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className="bg-blue-600 dark:bg-neon-blue h-full rounded-full shadow-[0_0_10px_rgba(0,242,255,0.3)]"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-auto pr-4 space-y-10 custom-scrollbar">
                {Object.keys(groupedTasks).length > 0 ? Object.entries(groupedTasks).map(([phase, phaseTasks]) => (
                  <div key={phase} className="relative">
                    <h4 className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-[0.3em] border-b border-slate-50 dark:border-white/5 pb-3 mb-6 sticky top-0 bg-white dark:bg-dark-card z-10">{phase}</h4>
                    <div className="space-y-4">
                      {phaseTasks.map((task, idx) => {
                        const isFocus = firstIncompleteTask?.description === task.description;
                        return (
                          <div 
                            key={idx} 
                            onClick={() => handleToggleTask(task.description, !task.completed)}
                            className={`group flex items-start gap-4 p-5 rounded-3xl border-2 transition-all cursor-pointer ${task.completed ? 'bg-emerald-50/30 dark:bg-emerald-900/10 border-emerald-100/50 dark:border-emerald-900/50 opacity-50' : isFocus ? 'bg-blue-50/50 dark:bg-blue-900/20 border-blue-400 dark:border-neon-blue shadow-xl shadow-blue-500/10 dark:shadow-neon-blue/10 ring-2 ring-blue-500/10' : 'bg-slate-50/50 dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-neon-blue hover:bg-white dark:hover:bg-dark-card shadow-sm hover:shadow-xl hover:shadow-blue-500/5 dark:hover:shadow-black/20'}`}
                          >
                            <div className={`mt-1 w-6 h-6 rounded-xl flex items-center justify-center flex-shrink-0 border-2 transition-all duration-500 ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30 rotate-[360deg]' : 'border-slate-200 dark:border-slate-800 group-hover:border-blue-400 dark:group-hover:border-neon-blue group-hover:rotate-12'}`}>
                              {task.completed && <CheckCircle2 size={14} strokeWidth={3} />}
                            </div>
                            <span className={`text-sm font-bold leading-relaxed transition-colors ${task.completed ? 'text-slate-400 dark:text-slate-600 line-through' : 'text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-neon-blue'}`}>
                              {task.description}
                              {isFocus && !task.completed && (
                                <span className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-neon-blue text-[8px] font-black uppercase rounded-lg tracking-widest">Active Focus</span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center space-y-6 opacity-20 grayscale">
                    <CheckCircle2 size={60} className="text-slate-300 dark:text-slate-700" />
                    <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em]">No Active Instruction</p>
                  </div>
                )}
              </div>
            </section>
          </aside>

        </div>

        {/* Global Footer */}
        <footer className="mt-20 pt-12 border-t border-slate-100 dark:border-white/5 text-center opacity-30 group hover:opacity-100 transition-opacity">
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em] flex items-center justify-center gap-4">
            <span>Core v2.4</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
            <span>Neural Orchestration Engine</span>
            <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700"></span>
            <span>&copy; 2026 Ralph Commander</span>
          </p>
        </footer>

      </div>
    </div>
  );
}