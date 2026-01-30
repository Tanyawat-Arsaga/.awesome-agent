# Ralph Commander: Modern Web Upgrade Plan

- [ ] **Phase 1: Real-time Infrastructure (WebSockets)**
    - [x] Implement Elysia WebSocket handler for real-time state and log updates
    - [ ] Create `useRalphWS` hook for frontend connection management
    - [ ] Implement `fs.watch` backend logic to monitor `.gemini/ralph-loop.local.md` and `ralph-runner.log`
    - [ ] Implement line-by-line log streaming (pushing diffs over WS)
    - [ ] Add visual connection status indicator (Socket Connected/Disconnected)

- [ ] **Phase 2: UI/UX Foundation & Theme**
    - [ ] Setup Zustand for unified global state management
    - [ ] Implement Dark Mode support with Tailwind and manual/system toggle
    - [ ] Refactor monolithic `+Page.tsx` into atomic components (`LogViewer`, `StatsGrid`, `TaskList`)
    - [ ] Apply glassmorphism and neon aesthetic styles to the UI
    - [ ] Add `framer-motion` for smooth micro-interactions and state transitions

- [ ] **Phase 3: Advanced Log Viewer**
    - [ ] Implement smart auto-scroll (pauses when user scrolls up)
    - [ ] Add log filters (All, Thoughts, Errors)
    - [ ] Implement local search functionality within the log viewer
    - [ ] Add syntax highlighting for code blocks detected in log output
    - [ ] Implement log truncation/virtualization for large files (>1MB) to maintain performance

- [ ] **Phase 4: Task Management & Visibility**
    - [ ] Add a progress bar for overall plan completion tracking
    - [ ] Implement "Focus Mode" highlighting for the active task
    - [ ] Add manual task status overrides (complete/incomplete) via UI and API
    - [ ] Implement "Zombie Loop" detection (visual warning if runner process is stale)

- [ ] **Phase 5: Operational Analytics & Polish**
    - [ ] Implement time tracking statistics (total duration, time per iteration)
    - [ ] Add query density sparkline or heatmap visualization
    - [ ] Add token/cost estimation display (if data is available)
    - [ ] Implement keyboard shortcuts (Cmd+Enter to start, Esc to stop, L to clear, D for theme)
    - [ ] Add tooltips to explain complex statistics and metrics

- [ ] **Phase 6: Quality Assurance**
    - [ ] Add Vitest component tests for new UI elements
    - [ ] Implement Playwright E2E tests for the full loop workflow
    - [ ] Perform Lighthouse audit and resolve accessibility/performance bottlenecks
    - [ ] Verify auto-recovery logic in runner scripts and backend handlers
