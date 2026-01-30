import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useRalphStore } from '../../renderer/store/useRalphStore';
import { useRalphWS } from '../../renderer/hooks/useRalphWS';
import { StatsGrid } from './components/StatsGrid';
import { LogViewer } from './components/LogViewer';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Power, RefreshCcw, FileCode, CheckCircle2, Moon, Sun } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

// Re-importing necessary components as they might have been reset
// Assuming LogViewer and StatsGrid are correctly imported and functional

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Page() {
  const { 
    status, setStatus, 
    logs, appendLogs, 
    tasks, setTasks, 
    changedFiles, setChangedFiles,
    clearLogs
  } = useRalphStore();

  const { connected: wsConnected } = useRalphWS(); // Hook for WS connection status

  // Form State
  const [prompt, setPrompt] = useState('');
  const [maxIterations, setMaxIterations] = useState(20);
  const [completionPromise, setCompletionPromise] = useState('DONE');
  const [agent, setAgent] = useState('gemini');
  const [model, setModel] = useState('auto');
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [resume, setResume] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isDark, setIsDark] = useState(false); // State for theme toggle
  
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Fetch models on mount
  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch('/api/agent/models');
      const data = await res.json();
      if (data.success) {
        const aliases = ['auto', 'pro', 'flash', 'flash-lite'];
        setAvailableModels(data.models.filter((m: string) => !aliases.includes(m)));
      }
    } catch (err) { console.error('Failed to fetch models', err); }
  }, []);

  // Sync state from backend (initially via fetch, then primarily WS)
  const syncState = useCallback(async () => {
    if (!status?.active) { // Only poll if agent is inactive to avoid WS conflict
      try {
        const [tRes, fRes] = await Promise.all([
          fetch('/api/ralph/tasks'),
          fetch('/api/ralph/files')
        ]);
        setTasks(await tRes.json());
        setChangedFiles(await fRes.json());
      } catch (e) { console.error("Sync failed for tasks/files", e); }
    }
  }, [status?.active]);

  const handleStop = async () => {
    if (!confirm('Stop the autonomous lifecycle?')) return;
    await fetch('/api/ralph/stop', { method: 'POST' });
    syncState(); // Refresh status after stop
  };

  const handleStart = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!resume && status?.active) {
      alert('Agent is already running. Please stop it first or use "Resume".');
      return;
    }
    
    const res = await fetch('/api/ralph/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, max_iterations: maxIterations, completion_promise: completionPromise, agent, model, resume })
    });
    if (res.ok) { 
      setPrompt(''); 
      setResume(false); 
      syncState(); // Refresh status after start
    } else {
      alert('Failed to start agent: ' + await res.text());
    }
  };

  // useEffect for WebSocket connection and message handling
  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimer: any;

    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      socket = new WebSocket(`${protocol}//${host}/ws`);

      socket.onopen = () => {
        setWsConnected(true);
        console.log('📡 Ralph WS: Connected');
        // Request initial state and logs on open
        socket.send(JSON.stringify({ type: 'initial_state' }));
      };

      socket.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'status') {
            setStatus(msg.data);
          } else if (msg.type === 'logs') {
            appendLogs(msg.data);
          } else if (msg.type === 'tasks') {
            setTasks(msg.data);
          } else if (msg.type === 'files') {
            setChangedFiles(msg.data);
          }
        } catch (e) {
          console.error('📡 Ralph WS: Error parsing message', e);
        }
      };

      socket.onclose = () => {
        setWsConnected(false);
        console.warn('📡 Ralph WS: Disconnected, retrying...');
        reconnectTimer = setTimeout(connect, 3000);
      };
    };

    connect();
    return () => {
      socket?.close();
      clearTimeout(reconnectTimer);
    };
  }, [setStatus, appendLogs, setTasks, setChangedFiles]); // Dependencies: re-run if store actions change

  // Initial sync and periodic polling fallback
  useEffect(() => {
    fetchModels();
    syncState(); // Initial sync
    const interval = setInterval(syncState, 10000); // Poll every 10s as fallback
    return () => clearInterval(interval);
  }, [syncState]); // syncState is stable due to useCallback

  // Auto-scroll logs
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  if (!status) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg text-slate-400 font-medium">
      <motion.div 
        animate={{ opacity: [0.5, 1, 0.5] }} 
        transition={{ duration: 2, repeat: Infinity }}
        className="flex flex-col items-center gap-4"
      >
        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="font-black uppercase tracking-[0.4em] text-[10px]">Initializing Ralph Commander...</p>
      </motion.div>
    </div>
  );

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
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg text-slate-900 dark:text-slate-100 font-sans py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Header Section */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 mb-10">
          <div className="flex items-center gap-8">
            <div>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-3">
                <span className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl shadow-blue-500/20 rotate-3">RC</span>
                Ralph Commander
              </h1>
              <div className="flex gap-6 mt-3 items-center ml-1">
                <p className="text-slate-400 dark:text-slate-500 font-bold text-xs uppercase tracking-[0.2em]">Autonomous Lifecycle Orchestrator</p>
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${wsConnected ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>
                  {wsConnected ? 'Uplink Stable' : 'Uplink Lost'}
                </div>
              </div>
            </div>

            <div className="h-12 w-px bg-slate-200 dark:bg-white/10 hidden xl:block"></div>

            <div className="hidden xl:flex gap-8">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Engine</span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter">{status.agent}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Model</span>
                <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter">{status.model}</span>
              </div>
              {status.active && status.completion_promise && (
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Promise</span>
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
            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm border ${status.active ? 'bg-emerald-50 text-green-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
              ● {status.active ? 'Agent Active' : 'Standby'}
            </div>
            {status.active && (
              <button 
                onClick={handleStop} 
                className="group relative px-8 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-rose-500/20 hover:shadow-rose-500/40 active:scale-95"
              >
                <Power size={14} className="inline mr-2 group-hover:rotate-90 transition-transform" />
                TERMINATE
              </button>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Deployment Console */}
            <AnimatePresence>
              {!status.active && (
                <motion.section 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl rounded-[3rem] border border-white/50 dark:border-white/10 p-10 relative overflow-hidden group"
                >
                  <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
                    <Rocket size={200} />
                  </div>
                  
                  <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center">
                      <Rocket size={20} />
                    </div>
                    Deploy Mission
                  </h3>

                  <form onSubmit={handleStart} className="space-y-8 relative z-10">
                    <div className="space-y-3">
                      <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Mission Parameters</label>
                      <textarea 
                        value={prompt} 
                        onChange={e => setPrompt(e.target.value)} 
                        placeholder="What should Ralph build today?" 
                        required 
                        className="w-full h-32 px-8 py-6 bg-slate-50 dark:bg-dark-bg border-2 border-slate-100 dark:border-white/5 rounded-[2rem] focus:border-blue-500 dark:focus:border-neon-blue focus:bg-white dark:focus:bg-dark-card transition-all outline-none resize-none text-lg font-bold text-slate-700 dark:text-slate-200 placeholder-slate-300 dark:placeholder-slate-700"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Turn Limit</label>
                        <input 
                          type="number" 
                          value={maxIterations} 
                          onChange={e => setMaxIterations(parseInt(e.target.value))} 
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-dark-bg border-2 border-slate-100 dark:border-white/5 rounded-2xl focus:border-blue-500 dark:focus:border-neon-blue outline-none font-bold text-slate-700 dark:text-slate-200 text-center"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Engine</label>
                        <select 
                          value={agent} 
                          onChange={e => setAgent(e.target.value)} 
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-dark-bg border-2 border-slate-100 dark:border-white/5 rounded-2xl focus:border-blue-500 dark:focus:border-neon-blue outline-none bg-white dark:bg-dark-card font-bold text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                        >
                          <option value="gemini">Gemini CLI</option>
                          <option value="claude">Claude Code</option>
                        </select>
                      </div>
                      <div className="space-y-3">
                        <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-2">Neural Model</label>
                        <select 
                          value={model} 
                          onChange={e => setModel(e.target.value)} 
                          className="w-full px-6 py-4 bg-slate-50 dark:bg-dark-bg border-2 border-slate-100 dark:border-white/5 rounded-2xl focus:border-blue-500 dark:focus:border-neon-blue outline-none bg-white dark:bg-dark-card font-bold text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                        >
                          <optgroup label="Standard Aliases">
                            <option value="auto">auto (Standard)</option>
                            <option value="pro">pro (Reasoning)</option>
                            <option value="flash">flash (Speed)</option>
                            <option value="flash-lite">flash-lite</option>
                          </optgroup>
                          {availableModels.length > 0 && (
                            <optgroup label="Concrete Models">
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

            {/* Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/50 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">Turn</label>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">{status.iteration}</span>
                  <span className="text-lg text-slate-400 dark:text-slate-500 font-bold">/ {status.max_iterations}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-white/5 rounded-full h-2.5 mt-4 overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((status.iteration / (status.max_iterations || 1)) * 100, 100)}%` }}
                    className="bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-neon-blue dark:to-blue-600 h-full rounded-full shadow-[0_0_10px_rgba(0,242,255,0.3)]"
                    transition={{ duration: 1.5, ease: "circOut" }}
                  />
                </div>
              </div>
              <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/50 dark:border-white/5 shadow-xl shadow-slate-200/50 dark:shadow-black/20">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">Queries</label>
                <div className="text-4xl font-black text-indigo-600 dark:text-neon-purple">{status.queries || 0}</div>
              </div>
              <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/50 dark:border-white/5 overflow-hidden">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">Model</label>
                <div className="text-lg font-black text-slate-800 dark:text-slate-200 truncate">{status.model || 'auto'}</div>
                <div className="text-xs font-bold text-slate-400 dark:text-slate-600 uppercase mt-1 truncate">{status.agent}</div>
              </div>
              <div className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-xl p-6 rounded-[2rem] border border-white/50 dark:border-white/5 overflow-hidden">
                <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">Promise</label>
                <div className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-300 bg-slate-50 dark:bg-black/30 p-2 rounded-lg border border-slate-100 dark:border-white/10 truncate">
                  {status.completion_promise || 'null'}
                </div>
              </div>
            </div>

            {/* Files Changed */}
            {changedFiles.length > 0 && (
              <div className="bg-white/50 dark:bg-dark-card/50 backdrop-blur-md rounded-[3rem] border border-white/50 dark:border-white/10 p-8">
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                    <FileCode size={16} className="text-blue-500 dark:text-neon-blue" />
                    Work-in-Progress Assets
                </h3>
                <div className="flex flex-wrap gap-3">
                  {changedFiles.map((file, idx) => (
                    <div key={idx} className="group px-4 py-2 bg-slate-900 dark:bg-black/30 text-white rounded-2xl text-[10px] font-bold flex gap-3 shadow-lg shadow-slate-900/10 hover:scale-105 transition-transform cursor-default border border-white/5">
                      <span className={`w-2 h-2 rounded-full ${file.status === 'M' ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'}`}></span>
                      <span className="opacity-40 font-black tracking-widest">{file.status}</span>
                      <span className="text-slate-300">{file.path}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Terminal Output */}
            <div className="h-[750px]">
              <LogViewer logs={logs} onClear={handleClearLogs} />
            </div>
          </div>

          {/* Blueprint Sidebar */}
          <aside className="lg:col-span-4 space-y-8">
            <section className="bg-white dark:bg-dark-card rounded-[3rem] shadow-2xl shadow-slate-200/50 dark:shadow-black/20 border border-white dark:border-white/5 p-10 sticky top-12 max-h-[calc(100vh-6rem)] overflow-auto flex flex-col transition-all hover:shadow-slate-300/50 dark:hover:shadow-black/40">
              <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-4">
                <div className="w-10 h-10 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg flex items-center justify-center">
                  <CheckCircle2 size={20} />
                </div>
                Lifecycle Blueprint
              </h3>
              
              <div className="flex-1 overflow-auto pr-4 space-y-10 custom-scrollbar">
                {Object.keys(groupedTasks).length > 0 ? Object.entries(groupedTasks).map(([phase, phaseTasks]) => (
                  <div key={phase} className="relative">
                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] border-b pb-3 mb-6">{phase}</h4>
                    <div className="space-y-4">
                      {phaseTasks.map((task, idx) => {
                        const isFocus = firstIncompleteTask?.description === task.description;
                        return (
                          <div 
                            key={idx} 
                            onClick={() => handleToggleTask(task.description, !task.completed)}
                            className={`flex items-start gap-4 p-5 rounded-3xl border-2 transition-all ${task.completed ? 'bg-emerald-50/50 border-emerald-100/50 opacity-60' : isFocus ? 'bg-blue-50/50 border-blue-100 group' : 'bg-slate-50/50 border-slate-100 hover:border-blue-200 group'}`}
                          >
                            <div className={`mt-1 w-6 h-6 rounded-xl flex items-center justify-center flex-shrink-0 border-2 transition-all duration-500 ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/30 rotate-[360deg]' : 'border-slate-200 group-hover:border-blue-400 group-hover:rotate-12'}`}>
                              {task.completed && <CheckCircle2 size={14} strokeWidth={3} />}
                            </div>
                            <span className={`text-sm font-bold leading-relaxed transition-colors ${task.completed ? 'text-slate-500 line-through' : 'text-slate-700 group-hover:text-blue-600'}`}>
                              {task.description}
                              {isFocus && !task.completed && (
                                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-600 rounded-lg text-[8px] font-black uppercase tracking-widest">Active Focus</span>
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )) : (
                  <div className="h-64 flex flex-col items-center justify-center text-center space-y-6 opacity-20">
                    <CheckCircle2 size={60} className="text-slate-300" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">No Active Instruction</p>
                  </div>
                )}
              </div>
            </section>
          </div>

        </div>

        {/* Global Footer */}
        <footer className="mt-20 pt-12 border-t border-slate-100 dark:border-white/5 text-center opacity-30 group hover:opacity-100 transition-opacity">
          <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.5em] flex items-center justify-center gap-4">
            <span>Core v2.6</span>
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
