import { describe, it, expect, vi } from "vitest";

const mockReadFile = vi.fn(async (path: string) => {
  if (path.includes("missing")) {
    const err = new Error("ENOENT");
    (err as any).code = "ENOENT";
    throw err;
  }
  return `---
active: true
iteration: 5
max_iterations: 10
completion_promise: "DONE"
started_at: "2026-01-30T12:00:00Z"
---
Test prompt content`;
});

vi.mock("fs/promises", () => ({
  readFile: (path: string) => mockReadFile(path),
  stat: vi.fn().mockResolvedValue({ size: 100 }),
  open: vi.fn().mockResolvedValue({ 
    read: vi.fn(), 
    close: vi.fn() 
  })
}));

vi.mock("fs", () => ({
  watch: vi.fn().mockReturnValue({ close: vi.fn() })
}));

import { getRalphStatus, getRalphTasks } from "../src/server/services/ralph";

describe("Ralph Service", () => {
  it("should parse a valid status file", async () => {
    const status = await getRalphStatus();
    expect(status).not.toBeNull();
    expect(status?.active).toBe(true);
    expect(status?.iteration).toBe(5);
    expect(status?.prompt).toBe("Test prompt content");
  });

  it("should parse tasks from @fix_plan.md", async () => {
    mockReadFile.mockResolvedValueOnce(`
# Ralph Commander Plan
- [x] Task 1
- [ ] Task 2
**Phase 2: UI**
- [ ] Task 3
    `);
    
    const tasks = await getRalphTasks();
    expect(tasks.length).toBe(3);
    expect(tasks[0].completed).toBe(true);
    expect(tasks[1].completed).toBe(false);
    expect(tasks[2].phase).toBe("UI");
  });
});