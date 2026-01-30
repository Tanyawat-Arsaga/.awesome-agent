# Ralph Commander - Internal Specifications

## 1. Overview
Ralph Commander is a specialized management interface for autonomous coding agent loops (specifically for Ralph/Gemini CLI). It provides real-time visibility and control over long-running iterative tasks.

## 2. State & Persistence

### 2.1 Agent State File (`.gemini/ralph-loop.local.md`)
The source of truth for the loop's execution state.
- **Format**: Markdown with YAML frontmatter.
- **Frontmatter Schema**:
  ```yaml
  active: boolean      # Is the loop currently running?
  iteration: number   # Current turn count
  max_iterations: number
  completion_promise: string # Success trigger phrase
  started_at: string   # ISO timestamp
  queries: number      # Total LLM queries made
  phase: string        # Current logical phase (e.g. "THINKING", "ACTING")
  agent: string        # "gemini" | "claude"
  model: string        # Model identifier or "auto"
  ```
- **Body**: Contains the raw initial prompt.

### 2.2 Execution Metadata
- **PID File (`.gemini/runner.pid`)**: Stores the process ID of the `run-loop.sh` process group. Used for reliable termination.
- **Stats Store (`.gemini/stats.json`)**: Persistent telemetry.
  - `iteration_times`: List of `{ iteration: number, duration_ms: number, queries: number }`.
  - `start_times`: Map of `iteration -> ISO timestamp`.
  - `queries_at_last_iteration`: Offset for calculating incremental queries.

### 2.3 Task Plan (`@fix_plan.md`)
- Parsed by the backend to generate the "Active Blueprint".
- **Pattern**:
  - Phases: `**Phase \d+: (.*?)**`
  - Tasks: `- [ ] description` or `- [x] description`

## 3. Backend Services (ElysiaJS)

### 3.1 API Endpoints (`/api`)
- **GET `/ralph/status`**: Returns the combined state from the state file and stats store.
  - Includes `is_zombie` flag (true if `active: true` but PID is dead).
- **GET `/ralph/tasks`**: Returns parsed tasks from `@fix_plan.md`.
- **GET `/ralph/logs`**: Returns the full content of `ralph-runner.log`.
- **DELETE `/ralph/logs`**: Wipes the log file.
- **GET `/ralph/files`**: Returns changed files via `git status --porcelain`.
- **GET `/agent/models`**: Returns available models for the selected agent.
- **POST `/ralph/start`**: Spawns `scripts/run-loop.sh`.
  - Payload: `{ prompt, max_iterations, completion_promise, agent, model, resume }`.
- **POST `/ralph/stop`**: 
  - Sets `active: false` in the state file.
  - Kills the process group via PID using `process.kill(-pid, 'SIGTERM')`.

### 3.2 Real-time Sync (WebSockets)
- **Endpoint**: `/ws`
- **Topic**: `ralph-updates`
- **Messages**:
  - `{ type: "status", data: RalphStatus }`
  - `{ type: "tasks", data: RalphTask[] }`
  - `{ type: "logs", data: string }` (Incremental text chunks)

### 3.3 Watcher Logic
- **FS Watchers**:
  - Watch `.gemini/` for `ralph-loop.local.md` changes.
  - Watch root for `@fix_plan.md` changes.
  - Watch root for `ralph-runner.log` growth (using byte offset to stream only new data).

## 4. Frontend Architecture (React + Vike)

### 4.1 Global Store (`useRalphStore`)
- Uses `zustand` for state management.
- Handles `logs` as an array of strings or a single large buffer with efficient updates.

### 4.2 UI Components
- **StatsGrid**: 
  - **Velocity**: Average iteration duration.
  - **Efficiency**: Queries per iteration.
  - **Duration**: Total time since `started_at`.
- **ControlPanel**:
  - Validates inputs before starting.
  - Provides "Resume" toggle to skip prompt requirement if `@fix_plan.md` exists.
- **LogViewer**: Terminal-style output with auto-scroll and ANSI color support.

## 5. Failure Recovery & Robustness
- **Zombie Detection**: If `state.active` is true but the process in `runner.pid` does not exist (checked via `process.kill(pid, 0)`), the UI shows a "Zombie" state and allows cleanup.
- **Process Group Kill**: Stopping the loop kills the entire shell tree to prevent orphaned `gemini` or `claude` processes.

## 6. Development Philosophy
- **No Placeholders**: If data isn't available from the system, don't show it or show "N/A".
- **Fail Fast**: The commander should be the first thing to tell you if the agent is stuck.
- **Lightweight**: Zero-config where possible; rely on standard paths.
