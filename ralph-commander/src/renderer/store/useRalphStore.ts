import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface RalphStatus {
  active: boolean;
  iteration: number;
  max_iterations: number;
  completion_promise: string;
  started_at: string;
  prompt?: string;
  agent?: string;
  model?: string;
  queries?: number;
  phase?: string;
  stats?: any;
  is_zombie?: boolean; // Added for zombie detection
}

export interface RalphTask {
  description: string;
  completed: boolean;
  phase?: string;
}

export interface RalphFile {
  status: string;
  path: string;
}

interface RalphState {
  status: RalphStatus | null;
  logs: string;
  tasks: RalphTask[];
  changedFiles: RalphFile[];
  
  // Actions
  setStatus: (status: RalphStatus) => void;
  appendLogs: (newLogs: string) => void;
  setLogs: (logs: string) => void; // For clearing or full replacement
  setTasks: (tasks: RalphTask[]) => void;
  setChangedFiles: (files: RalphFile[]) => void;
  clearLogs: () => void; 
}

export const useRalphStore = create<RalphState>()(devtools((set) => ({
  status: null,
  logs: '',
  tasks: [],
  changedFiles: [],

  setStatus: (status) => set({ status }),
  appendLogs: (newLogs) => set((state) => ({ logs: state.logs + newLogs })),
  setLogs: (logs) => set({ logs }), // For clearing or full replacement
  setTasks: (tasks) => set({ tasks }),
  setChangedFiles: (changedFiles) => set({ changedFiles }),
  clearLogs: () => set({ logs: '' }), // Action to clear logs
})));