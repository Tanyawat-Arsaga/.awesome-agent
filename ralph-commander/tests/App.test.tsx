import { describe, it, expect, vi, beforeAll } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import Page from "../src/pages/index/+Page";

describe("Index Page Component", () => {
  beforeAll(() => {
    // Mock fetch
    global.fetch = vi.fn((url) => {
        if (url.toString().includes("/logs")) {
          return Promise.resolve({
              ok: true,
              text: () => Promise.resolve("Mock Logs\nLine 2")
          } as any);
        }
        if (url.toString().includes("/tasks")) {
          return Promise.resolve({
              ok: true,
              json: () => Promise.resolve([])
          } as any);
        }
        if (url.toString().includes("/files")) {
          return Promise.resolve({
              ok: true,
              json: () => Promise.resolve([])
          } as any);
        }
        if (url.toString().includes("/agent/models")) {
          return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({ success: true, models: [] })
          } as any);
        }
        return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                active: true,
                iteration: 1,
                max_iterations: 10,
                completion_promise: "TEST",
                started_at: new Date().toISOString(),
                prompt: "Test Prompt"
            })
        } as any);
    });
  });

  it("renders the header", async () => {
    render(<Page />);
    
    // Check for "Ralph Commander" header specifically
    const headerElement = await screen.findByRole('heading', { name: /Ralph Commander/i });
    expect(headerElement).toBeDefined();
  });
});
