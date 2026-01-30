import { join } from 'path';
import { Elysia } from 'elysia';
import { staticPlugin } from '@elysiajs/static';
import { cors } from '@elysiajs/cors';
import { connect } from 'elysia-connect-middleware';
import { renderPage } from 'vike/server';
import { getRalphStatus, getRalphTasks, watchRalphFiles, toggleRalphTask } from './services/ralph';

const isProduction = process.env.NODE_ENV === 'production';
const root = process.cwd();

export const app = new Elysia()
  .use(cors())
  // 1. WebSocket Handler (MUST be before catch-all)
  .ws('/ws', {
    open(ws) {
      ws.subscribe('ralph-updates');
      console.log('📡 WS: Client connected');
      
      // Send initial status
      getRalphStatus().then(status => {
        if (status) ws.send(JSON.stringify({ type: 'status', data: status }));
      });
    },
    message(ws, message: any) {
      if (message === 'ping') ws.send(JSON.stringify({ type: 'pong' }));
    },
    close(ws) {
      ws.unsubscribe('ralph-updates');
      console.log('📡 WS: Client disconnected');
    }
  });

// Setup file watchers for WS broadcasting
watchRalphFiles((type, data) => {
  app.server?.publish('ralph-updates', JSON.stringify({ type, data }));
});

// 2. API Routes Group
app.group('/api', (api) => 
  api
    .get("/health", () => ({ status: "ok" }))
    .get("/ralph/status", async () => {
      const status = await getRalphStatus();
      let stats = {};
      try {
        const statsFile = Bun.file(".gemini/stats.json");
        if (await statsFile.exists()) {
          const raw = await statsFile.json();
          stats = raw.stats || {};
        }
      } catch (e) {}
      // Ensure default values if status is null
      const defaultStatus = { 
        active: false, 
        iteration: 0, 
        max_iterations: 0, 
        completion_promise: "", 
        started_at: "", 
        queries: 0,
        agent: "gemini",
        model: "auto",
        phase: "IDLE"
      };
      return { ...(defaultStatus), ...(status || {}), stats };
    })
    .get("/ralph/tasks", async () => await getRalphTasks())
    .post("/ralph/tasks/toggle", async ({ body }: any) => {
      const { description, completed } = body;
      const success = await toggleRalphTask(description, completed);
      return { success };
    })
    .get("/ralph/files", async () => {
      try {
        const proc = Bun.spawn(["git", "status", "--porcelain"], { stdout: "pipe" });
        const output = await new Response(proc.stdout).text();
        return output.split("\n").filter(l => l.trim()).map(line => ({
          status: line.slice(0, 2).trim(),
          path: line.slice(3).trim()
        }));
      } catch (e) { return []; }
    })
    .get("/agent/models", async () => {
      try {
        const proc = Bun.spawn(["gemini", "hello", "-o", "json", "--yolo"], {
          stdout: "pipe",
          stderr: "ignore"
        });
        const text = await new Response(proc.stdout).text();
        if (!text || !text.trim().startsWith("{")) throw new Error("Invalid JSON output from agent");
        const data = JSON.parse(text);
        return { success: true, models: Object.keys(data.stats?.models || {}) };
      } catch (e) {
        console.error("Failed to probe models:", e);
        // Fallback models if probe fails or JSON is invalid
        return { 
          success: true, 
          models: ["auto", "pro", "flash", "flash-lite", "gemini-2.0-flash-exp"],
          is_fallback: true 
        };
      }
    })
    .get("/ralph/logs", async () => {
      try {
        const file = Bun.file("ralph-runner.log");
        return await file.exists() ? await file.text() : "";
      } catch { return ""; }
    })
    .delete("/ralph/logs", async () => {
      await Bun.write("ralph-runner.log", "");
      // Broadcast log clear via WS
      app.server?.publish('ralph-updates', JSON.stringify({ type: 'log-clear' }));
      return { success: true };
    })
    .post("/ralph/stop", async () => {
      const stateFile = ".gemini/ralph-loop.local.md";
      if (await Bun.file(stateFile).exists()) {
          const content = await Bun.file(stateFile).text();
          await Bun.write(stateFile, content.replace("active: true", "active: false"));
      }
      const pidFile = Bun.file(".gemini/runner.pid");
      if (await pidFile.exists()) {
        const pid = await pidFile.text();
        if (pid.trim()) {
          try { 
            // Kill the entire process group (negative PID)
            process.kill(-parseInt(pid.trim()), 'SIGTERM'); 
          } catch (e) {
            try { process.kill(parseInt(pid.trim()), 'SIGTERM'); } catch(e2) {} // Fallback if negative PID doesn't work
          }
        }
        await Bun.write(".gemini/runner.pid", "");
      }
      return { success: true };
    })
    .post("/ralph/start", async ({ body }: any) => {
      const { prompt, max_iterations, completion_promise, agent = "gemini", model = "", resume = false } = body;
      if (!prompt && !resume) return { success: false, error: "Prompt is required" };
      if (!["gemini", "claude"].includes(agent)) return { success: false, error: "Invalid agent" };
      
      await Bun.write("ralph-runner.log", `🚀 Launching ${agent} lifecycle...\n`);
      const logFile = Bun.file("ralph-runner.log");
      
      const args = ["bash", "scripts/run-loop.sh", agent, prompt, String(max_iterations), completion_promise, model];
      if (resume) args.push("--resume");

      const proc = Bun.spawn(args, { stdout: logFile, stderr: logFile, stdin: "ignore" });
      await Bun.write(".gemini/runner.pid", String(proc.pid));
      return { success: true };
    })
);

// 3. Static Assets & Vike (Catch-all)
if (!isProduction && process.env.NODE_ENV !== 'test') {
  const { createDevMiddleware } = await import('vike/server');
  const { devMiddleware } = await createDevMiddleware({ root });
  app.use(connect(devMiddleware));
} else if (isProduction) {
  app.use(staticPlugin({ assets: join(root, 'dist', 'client'), prefix: '/' }));
}

// 4. Final Catch-all for Vike (must be last)
app.all('*', async (context) => {
  const url = new URL(context.request.url);
  // Explicitly skip API and WS routes, let Elysia handle them
  if (url.pathname.startsWith('/api') || url.pathname === '/ws') {
    return;
  }

  const pageContextInit = {
    urlOriginal: context.request.url,
    headers: Object.fromEntries(context.request.headers.entries())
  };
  
  const pageContext = await renderPage(pageContextInit);
  const { httpResponse } = pageContext;

  if (!httpResponse) {
    return context.set.status = 404;
  }

  const { body, statusCode, headers } = httpResponse;
  return new Response(body, {
    status: statusCode,
    headers: headers as HeadersInit
  });
});

if (import.meta.main) {
  app.listen({ port: 3000, hostname: '0.0.0.0' });
  console.log(`🦊 Ralph Commander (SSR) is running at http://localhost:3000`);
}
