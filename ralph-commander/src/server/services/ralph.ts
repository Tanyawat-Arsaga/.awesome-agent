import { join } from "path";
import { readFile } from "fs/promises";
import yaml from "js-yaml";

// We want to point to the .gemini folder in the current project root
const STATUS_FILE_PATH = join(process.cwd(), ".gemini", "ralph-loop.local.md");

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
}

export async function getRalphStatus(): Promise<RalphStatus | null> {
  try {
    const content = await readFile(STATUS_FILE_PATH, "utf-8");
    const parts = content.split("---");
    
    if (parts.length < 3) return null;

    const frontmatter = parts[1];
    const body = parts.slice(2).join("---").trim();
    
    const state = yaml.load(frontmatter) as any;
    
    return {
      active: state.active || false,
      iteration: state.iteration || 0,
      max_iterations: state.max_iterations || 0,
      completion_promise: state.completion_promise || "",
      started_at: state.started_at || "",
      prompt: body,
      agent: state.agent || "gemini",
      model: state.model || "",
      queries: state.queries || 0
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
    const lines = content.split("\n");
    const tasks: RalphTask[] = [];
    let currentPhase = "";

    for (const line of lines) {
      // Match phase headers like "- [ ] **Phase 7: ...**" or "### Phase 7: ..."
      const phaseMatch = line.match(/(?:- \[ [x ] \] )?\*\*Phase \d+: (.*?)\*\*/i) || line.match(/### Phase \d+: (.*)/i);
      if (phaseMatch) {
        currentPhase = phaseMatch[1];
        continue;
      }

      // Match tasks like "    - [x] Task name"
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
