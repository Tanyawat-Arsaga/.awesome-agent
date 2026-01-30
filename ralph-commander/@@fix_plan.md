# Ralph Commander: Implementation & Compliance Checklist

- [ ] **Phase 1: Compliance with Specifications**
    - [x] Backend: WebSocket synchronization for status, tasks, and logs
    - [x] Backend: `is_zombie` detection for active loops with dead PIDs
    - [x] Backend: Git inventory (`/api/ralph/files`) for changed files
    - [x] Backend: Agent engine model discovery (`/api/agent/models`)
    - [x] Backend: Process group termination (`SIGTERM` to `-PID`)
    - [x] UI: Display "Zombie Loop" warning indicator when `status.is_zombie` is true
    - [x] UI: Show "Completion Promise" on dashboard for active loops
    - [x] UI: Show "Agent" and "Model" as distinct, permanent labels in Header or Stats

- [ ] **Phase 2: Task Blueprint Enhancements**
    - [x] UI/API: Enable manual task status overrides (click task to toggle `[x]`)
    - [x] UI: Implement "Focus Mode" (visually highlight the first incomplete task)
    - [x] UI: Overall blueprint completion progress bar (e.g., "12/15 Tasks Done")

- [ ] **Phase 3: Log Viewer Advanced Features**
    - [ ] UI: Add local search functionality (find in logs)
    - [ ] UI: Add basic syntax highlighting for code blocks within log output
    - [ ] UI: Implement log virtualization/truncation for files > 1MB to prevent DOM lag

- [ ] **Phase 4: Operational Polish**
    - [ ] UI: Setup Keyboard Shortcuts (Cmd+Enter: Engage, Esc: Kill, L: Clear, D: Theme)
    - [ ] UI: Add "Engage Agent" confirmation if `resume` is not selected
    - [ ] UI: Theme Toggle (Dark/Light) - current UI seems to be mostly dark/white fixed
    - [ ] UI: Tooltip support for all complex metrics in StatsGrid

- [ ] **Phase 5: Reliability & QA**
    - [ ] Verify `process.kill(-pid)` reliability across different OS (Darwin/Linux)
    - [ ] Add Vitest tests for `useRalphStore` and `StatsGrid`
    - [ ] Implement Playwright E2E tests for the "Start -> Iterate -> Stop" flow
    - [ ] Perform Lighthouse audit and fix accessibility (ARIA labels, etc.)
