import { join } from "path";
import { readFile, stat, open } from "fs/promises";
import { watch } from "fs";
import yaml from "js-yaml";

const STATUS_FILE_PATH = join(process.cwd(), ".gemini", "ralph-loop.local.md");
const LOG_FILE_PATH = join(process.cwd(), "ralph-runner.log");

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

export async function getRalphStatus(): Promise<RalphStatus | null> {
  try {
    const content = await readFile(STATUS_FILE_PATH, "utf-8");
    const parts = content.split("---");
    if (parts.length < 3) return null;
    const state = yaml.load(parts[1]) as any;
    return {
      active: state.active || false,
      iteration: state.iteration || 0,
      max_iterations: state.max_iterations || 0,
      completion_promise: state.completion_promise || "",
      started_at: state.started_at || "",
      prompt: parts.slice(2).join("---").trim(),
      agent: state.agent || "gemini",
      model: state.model || "auto",
      queries: state.queries || 0,
      phase: state.phase || "IDLE"
    };
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      return { active: false, iteration: 0, max_iterations: 0, completion_promise: "", started_at: "", prompt: "", agent: "gemini", model: "auto", queries: 0, phase: "IDLE" };
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

    for (const line of content.split("\n")) {
      const phaseMatch = line.match(/(?:- \[ [x ] \] )?\*\*Phase \d+: (.*?)\*\*/i) || line.match(/### Phase \d+: (.*)/i);
      if (phaseMatch) {
        currentPhase = phaseMatch[1];
        continue;
      }

      const taskMatch = line.match(/^\s*-\s*\[([x ])\]\s*(.*)/);
      if (taskMatch) {
        tasks.push({
          description: taskMatch[2].trim(),
          completed: taskMatch[1].toLowerCase() === 'x',
          phase: currentPhase
        });
      }
    }
    return tasks;
  } catch (error) {
    console.error("Failed to read tasks:", error);
    return [];
  }
}

export async function toggleRalphTask(description: string, completed: boolean): Promise<boolean> {
  try {
    const planPath = join(process.cwd(), "@fix_plan.md");
    let content = await readFile(planPath, "utf-8");
    const escapedDesc = description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`^(\\s*-\\s*)\\[([x ])\\](\\s*${escapedDesc})`, 'm');
    const newMark = completed ? 'x' : ' ';
    const newContent = content.replace(pattern, `$1[${newMark}]$3`);
    if (newContent !== content) {
      await Bun.write(planPath, newContent);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Global state for log offset to avoid re-reading same content
let logOffset = 0;
let logWatcher: any = null; // To hold the watcher instance

export function watchRalphFiles(onUpdate: (type: 'status' | 'logs' | 'tasks' | 'files', data: any) => void) {
  // Watch status file
  const statusWatcher = watch(process.cwd(), async (event, filename) => {
    if (filename === "ralph-loop.local.md") {
      const status = await getRalphStatus();
      if (status) onUpdate('status', status);
    }
  });

  // Watch tasks file
  const tasksWatcher = watch(process.cwd(), async (event, filename) => {
    if (filename === "@fix_plan.md") {
      const tasks = await getRalphTasks();
      onUpdate('tasks', tasks);
    }
  });

  // Log streaming logic
  const readNewLogs = async () => {
    try {
      const fileInfo = await stat(LOG_FILE_PATH);
      if (fileInfo.size < logOffset) { // File truncated
        logOffset = 0;
      }
      
      if (fileInfo.size > logOffset) {
        const fd = await open(LOG_FILE_PATH, 'r');
        const buffer = Buffer.alloc(fileInfo.size - logOffset);
        await fd.read(buffer, 0, fileInfo.size - logOffset, logOffset);
        await fd.close();
        
        const newText = buffer.toString('utf-8');
        logOffset = fileInfo.size;
        if (newText) onUpdate('logs', newText);
      }
    } catch (e: any) {
      // File might not exist yet or other FS errors
      if (e.code !== 'ENOENT') console.error("Error reading logs:", e);
    }
  };

  // Initial read for logs and set offset
  stat(LOG_FILE_PATH).then(s => logOffset = s.size).catch(() => {});

  const logWatcher = watch(process.cwd(), (event, filename) => {
    if (filename === "ralph-runner.log") {
      readNewLogs();
    }
  });

  // Return cleanup function
  return () => {
    statusWatcher.close();
    tasksWatcher.close();
    logWatcher.close();
  };
}
