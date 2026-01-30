# Ralph Commander: Modern Web Upgrade Plan

- [x] **Phase 1: Real-time Infrastructure (WebSockets)**
    - [x] Implement Elysia WebSocket handler for real-time state and log updates
    - [x] Create `useRalphWS` hook for frontend connection management
    - [x] Implement `fs.watch` backend logic to monitor `.gemini/ralph-loop.local.md` and `ralph-runner.log`
    - [x] Implement line-by-line log streaming (pushing diffs over WS)
    - [x] Add visual connection status indicator (Socket Connected/Disconnected)

- [x] **Phase 2: UI/UX Foundation & Theme**
    - [x] Setup Zustand for unified global state management
    - [x] Implement Dark Mode support with Tailwind and manual/system toggle
    - [x] Refactor monolithic `+Page.tsx` into atomic components (`LogViewer`, `StatsGrid`, `TaskList`)
    - [x] Apply glassmorphism and neon aesthetic styles to the UI
    - [x] Add `framer-motion` for smooth micro-interactions and state transitions

- [x] **Phase 3: Advanced Log Viewer**
    - [x] Implement smart auto-scroll (pauses when user scrolls up)
    - [x] Add log filters (All, Thoughts, Errors)
    - [x] Implement local search functionality within the log viewer
    - [x] Add syntax highlighting for code blocks detected in log output
    - [x] Implement log truncation/virtualization for large files (>1MB) to maintain performance

- [x] **Phase 4: Task Management & Visibility**
    - [x] Add a progress bar for overall plan completion tracking
    - [x] Implement "Focus Mode" highlighting for the active task
    - [x] Add manual task status overrides (complete/incomplete) via UI and API
    - [x] Implement "Zombie Loop" detection (visual warning if runner process is stale)

- [x] **Phase 5: Operational Analytics & Polish**
    - [x] Implement time tracking statistics (total duration, time per iteration)
    - [x] Add query density sparkline or heatmap visualization
    - [x] Add token/cost estimation display (if data is available)
    - [x] Implement keyboard shortcuts (Cmd+Enter to start, Esc to stop, L to clear, D for theme)
    - [x] Add tooltips to explain complex statistics and metrics

- [x] **Phase 6: Quality Assurance**
    - [x] Add Vitest component tests for new UI elements
    - [x] Implement Playwright E2E tests for the full loop workflow
    - [x] Perform Lighthouse audit and resolve accessibility/performance bottlenecks
    - [x] Verify auto-recovery logic in runner scripts and backend handlers
