import { join } from "path";
import { readFile, stat, open } from "fs/promises";
import { watch } from "fs";
import yaml from "js-yaml";

const STATUS_FILE_PATH = join(process.cwd(), ".gemini", "ralph-loop.local.md");
const LOG_FILE_PATH = join(process.cwd(), "ralph-runner.log");
const STATS_PATH = join(process.cwd(), ".gemini", "stats.json");

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
  is_zombie?: boolean;
  stats?: {
    avg_iteration_ms: number;
    iteration_history: { iteration: number; duration_ms: number; queries: number }[];
    total_duration_ms: number;
  };
}

async function loadStats() {
  try {
    const data = await readFile(STATS_PATH, "utf-8");
    return JSON.parse(data || "{}");
  } catch {
    return {};
  }
}

async function saveStats(stats: any) {
  try {
    await Bun.write(STATS_PATH, JSON.stringify(stats, null, 2));
  } catch (e) {
    console.error("Failed to save stats:", e);
  }
}

let lastIteration = -1;
let iterationStartTime = Date.now();

export async function getRalphStatus(): Promise<RalphStatus | null> {
  try {
    const content = await readFile(STATUS_FILE_PATH, "utf-8");
    const parts = content.split("---");
    if (parts.length < 3) return null;
    
    const state = yaml.load(parts[1]) as any;
    const currentIteration = state.iteration || 0;
    const currentQueries = state.queries || 0;

    // Handle stats tracking
    const statsData = await loadStats();
    if (!statsData.iteration_times) statsData.iteration_times = [];
    if (!statsData.start_times) statsData.start_times = {};

    if (currentIteration > lastIteration && lastIteration !== -1) {
      const now = Date.now();
      const duration = now - iterationStartTime;
      
      if (lastIteration >= 0) {
        const existing = statsData.iteration_times.find((t: any) => t.iteration === lastIteration);
        if (!existing) {
          const prevQueries = statsData.queries_at_last_iteration || 0;
          statsData.iteration_times.push({ 
            iteration: lastIteration, 
            duration_ms: duration,
            queries: Math.max(0, currentQueries - prevQueries)
          });
          statsData.queries_at_last_iteration = currentQueries;
          await saveStats(statsData);
        }
      }
      iterationStartTime = now;
    }
    lastIteration = currentIteration;
    
    if (!statsData.start_times[currentIteration]) {
        statsData.start_times[currentIteration] = new Date().toISOString();
        statsData.queries_at_last_iteration = currentQueries;
        await saveStats(statsData);
    }

    let is_zombie = false;
    if (state.active) {
      try {
        const pidFile = join(process.cwd(), ".gemini", "runner.pid");
        const pid = await readFile(pidFile, "utf-8");
        if (pid.trim()) {
          process.kill(parseInt(pid.trim()), 0);
        } else {
          is_zombie = true;
        }
      } catch (e) {
        is_zombie = true;
      }
    }

    const avgIter = statsData.iteration_times.length > 0
        ? statsData.iteration_times.reduce((acc: number, curr: any) => acc + curr.duration_ms, 0) / statsData.iteration_times.length
        : 0;

    return {
      active: state.active || false,
      iteration: currentIteration,
      max_iterations: state.max_iterations || 0,
      completion_promise: state.completion_promise || "",
      started_at: state.started_at || "",
      prompt: parts.slice(2).join("---").trim(),
      agent: state.agent || "gemini",
      model: state.model || "auto",
      queries: currentQueries,
      phase: state.phase || "IDLE",
      is_zombie,
      stats: {
        avg_iteration_ms: avgIter,
        iteration_history: statsData.iteration_times,
        total_duration_ms: state.started_at ? Date.now() - new Date(state.started_at).getTime() : 0
      }
    };
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      return { active: false, iteration: 0, max_iterations: 0, completion_promise: "", started_at: "", prompt: "", queries: 0 };
    }
    return null;
  }
}

export interface RalphTask {
  description: string;
  completed: boolean;
  phase?: string;
}

export async function getRalphTasks(): Promise<RalphTask[]> {
  try {
    const planPath = join(process.cwd(), "@fix_plan.md");
    const content = await readFile(planPath, "utf-8");
    const tasks: RalphTask[] = [];
    let currentPhase = "";
    content.split("\n").forEach(line => {
      // Improved phase matching: look for Phase X: ...
      const pMatch = line.match(/\*\*Phase \d+: (.*?)\*\*/i);
      if (pMatch) {
        currentPhase = pMatch[1];
        return; // Skip adding the phase itself as a task
      }
      
      const tMatch = line.match(/^\s*-\s*\[([x ])\]\s*(.*)/);
      if (tMatch) {
        // Double check it's not a phase header that somehow matched tMatch
        if (tMatch[2].includes("**Phase")) return;
        
        tasks.push({ 
          description: tMatch[2].trim(), 
          completed: tMatch[1].toLowerCase() === 'x',
          phase: currentPhase 
        });
      }
    });
    return tasks;
  } catch { return []; }
}

export async function toggleRalphTask(description: string, completed: boolean): Promise<boolean> {
  try {
    const planPath = join(process.cwd(), "@fix_plan.md");
    const content = await readFile(planPath, "utf-8");
    const lines = content.split("\n");
    const newLines = lines.map(line => {
      const tMatch = line.match(/^(\s*-\s*\[)([x ])(\]\s*)(.*)/);
      if (tMatch && tMatch[4].trim() === description.trim()) {
        return `${tMatch[1]}${completed ? 'x' : ' '}${tMatch[3]}${tMatch[4]}`;
      }
      return line;
    });
    await Bun.write(planPath, newLines.join("\n"));
    return true;
  } catch (e) {
    console.error("Failed to toggle task:", e);
    return false;
  }
}

export function watchRalphFiles(onUpdate: (type: 'status' | 'logs' | 'tasks', data: any) => void) {
  const statusWatcher = watch(join(process.cwd(), ".gemini"), async (event, filename) => {
    if (filename === "ralph-loop.local.md") {
      const status = await getRalphStatus();
      if (status) onUpdate('status', status);
    }
  });
  const tasksWatcher = watch(process.cwd(), async (event, filename) => {
    if (filename === "@fix_plan.md") onUpdate('tasks', await getRalphTasks());
  });
  let logOffset = 0;
  stat(LOG_FILE_PATH).then(s => logOffset = s.size).catch(() => {});
  const logWatcher = watch(process.cwd(), async (event, filename) => {
    if (filename === "ralph-runner.log") {
      try {
        const s = await stat(LOG_FILE_PATH);
        if (s.size < logOffset) logOffset = 0;
        if (s.size > logOffset) {
          const fd = await open(LOG_FILE_PATH, 'r');
          const buffer = Buffer.alloc(s.size - logOffset);
          await fd.read(buffer, 0, s.size - logOffset, logOffset);
          await fd.close();
          const newText = buffer.toString('utf-8');
          logOffset = s.size;
          if (newText) onUpdate('logs', newText);
        }
      } catch {}
    }
  });
  return () => { statusWatcher.close(); tasksWatcher.close(); logWatcher.close(); };
}