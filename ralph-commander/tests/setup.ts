import "@testing-library/jest-dom";
import { vi } from "vitest";
import { JSDOM } from "jsdom";

const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
});

global.window = dom.window as any;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.Node = dom.window.Node;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLInputElement = dom.window.HTMLInputElement;
global.HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
global.HTMLButtonElement = dom.window.HTMLButtonElement;
global.HTMLSelectElement = dom.window.HTMLSelectElement;

// Use Bun's native WebSocket if available, otherwise JSDOM's (which is likely a stub)
if (typeof Bun !== 'undefined') {
  // @ts-ignore
  global.WebSocket = WebSocket;
} else {
  global.WebSocket = dom.window.WebSocket as any;
}

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
