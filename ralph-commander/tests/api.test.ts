import { describe, it, expect, vi } from "vitest";

// Mock vike/server to avoid SSR-related errors in test environment
vi.mock("vike/server", () => ({
  renderPage: vi.fn(async () => ({ httpResponse: null })),
  createDevMiddleware: vi.fn(async () => ({ devMiddleware: () => {} }))
}));

import { app } from "../src/server/index";

describe("Ralph Commander API", () => {
  it("GET /api/health should return ok", async () => {
    const response = await app.handle(new Request("http://localhost/api/health"));
    const json: any = await response.json();
    
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("status", "ok");
  });

  it("GET /api/ralph/status should return structure", async () => {
    const response = await app.handle(new Request("http://localhost/api/ralph/status"));
    const json: any = await response.json();
    
    expect(response.status).toBe(200);
    expect(json).toHaveProperty("active");
    expect(json).toHaveProperty("iteration");
  });

  it("GET /api/ralph/tasks should return array", async () => {
    const response = await app.handle(new Request("http://localhost/api/ralph/tasks"));
    const json: any = await response.json();
    
    expect(response.status).toBe(200);
    expect(Array.isArray(json)).toBe(true);
  });
  
  it("POST /api/ralph/start should fail without prompt", async () => {
      const response = await app.handle(
          new Request("http://localhost/api/ralph/start", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({})
          })
      );
      const json: any = await response.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe("Prompt is required");
  });
});