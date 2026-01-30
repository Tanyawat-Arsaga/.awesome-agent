import { join } from 'path';
import { Elysia } from 'elysia';
import { staticPlugin } from '@elysiajs/static';
import { cors } from '@elysiajs/cors';
import { connect } from 'elysia-connect-middleware';
import { renderPage } from 'vike/server';
import { getRalphStatus, getRalphTasks } from './services/ralph';

// Configuration
const isProduction = process.env.NODE_ENV === 'production';
const root = process.cwd();

export const app = new Elysia()
  .use(cors())
  .ws('/ws', {
    open(ws) {
      ws.subscribe('ralph-updates');
      console.log('📡 WS: Client connected');
    },
    message(ws, message: any) {
      if (message === 'ping') ws.send('pong');
    },
    close(ws) {
      ws.unsubscribe('ralph-updates');
      console.log('📡 WS: Client disconnected');
    }
  });

// Vike SSR Development Middleware
if (!isProduction && process.env.NODE_ENV !== 'test') {
  const { createDevMiddleware } = await import('vike/server');
  const { devMiddleware } = await createDevMiddleware({ root });
  app.use(connect(devMiddleware));
} else if (isProduction) {
  // Production: Serve static assets
  const assetsDir = join(root, 'dist', 'client');
  if (await Bun.file(join(assetsDir, 'index.html')).exists()) {
    app.use(
      staticPlugin({
        assets: assetsDir,
        prefix: '/'
      })
    );
  }
}

// API Routes
app
  .get("/api/health", () => ({ status: "ok" }))
  .get("/api/ralph/status", async () => {
    const status = await getRalphStatus();
    let stats = {};
    try {
      const statsFile = Bun.file(".gemini/stats.json");
      if (await statsFile.exists()) {
        const raw = await statsFile.json();
        stats = raw.stats || {};
      }
    } catch (e) {}
    return { ...(status || { active: false }), stats };
  })
  .get("/api/ralph/tasks", async () => {
    return await getRalphTasks();
  })
  .get("/api/ralph/files", async () => {
    try {
      const proc = Bun.spawn(["git", "status", "--porcelain"], { stdout: "pipe" });
      const output = await new Response(proc.stdout).text();
      return output.split("\n").filter(l => l.trim()).map(line => {
        const status = line.slice(0, 2).trim();
        const path = line.slice(3).trim();
        return { status, path };
      });
    } catch (e) { return []; }
  })
  .get("/api/agent/models", async () => {
    try {
      const proc = Bun.spawn(["gemini", "hello", "-o", "json", "--yolo"], {
        stdout: "pipe",
        stderr: "ignore"
      });
      const text = await new Response(proc.stdout).text();
      
      if (!text || !text.trim().startsWith("{")) {
        throw new Error("Invalid JSON output from agent");
      }

      const data = JSON.parse(text);
      const models = Object.keys(data.stats?.models || {});
      return { success: true, models };
    } catch (e) {
      console.error("Failed to probe models:", e);
      return { 
        success: true, 
        models: ["gemini-2.0-flash-exp", "gemini-2.0-pro-exp-02-05", "gemini-1.5-pro", "gemini-1.5-flash"],
        is_fallback: true 
      };
    }
  })
  .get("/api/ralph/logs", async () => {
    try {
      const logPath = "ralph-runner.log";
      const file = Bun.file(logPath);
      if (await file.exists()) return await file.text();
      return "";
    } catch { return "Error reading logs."; }
  })
  .delete("/api/ralph/logs", async () => {
    try {
      await Bun.write("ralph-runner.log", "");
      return { success: true };
    } catch (e) { 
      console.error(e);
      return { success: false, error: "Failed to clear logs" }; 
    } 
  })
  .post("/api/ralph/stop", async () => {
    try {
      // 1. Mark state file inactive
      const stateFile = ".gemini/ralph-loop.local.md";
      const file = Bun.file(stateFile);
      if (await file.exists()) {
        const content = await file.text();
        const updated = content.replace("active: true", "active: false");
        await Bun.write(stateFile, updated);
      }

      // 2. Kill the runner via PID file if it exists
      const pidFile = Bun.file(".gemini/runner.pid");
      if (await pidFile.exists()) {
        const pid = await pidFile.text();
        if (pid && pid.trim()) {
            try {
              // Kill the entire process group (negative PID)
              // This kills the bash script AND all its child agent processes
              process.kill(-parseInt(pid.trim()), 'SIGTERM');
            } catch (e) {
              try { process.kill(parseInt(pid.trim()), 'SIGTERM'); } catch(e2) {}
            }
        }
        await Bun.write(".gemini/runner.pid", "");
      }
      
      return { success: true };
    } catch (error) {
      console.error("Failed to stop Ralph:", error);
      return { success: false, error: "Failed to send stop signal" };
    }
  })
  .post("/api/ralph/start", async ({ body }: any) => {
    const { prompt, max_iterations, completion_promise, agent = "gemini", model = "" } = body;
    if (!prompt) return { success: false, error: "Prompt is required" };
    if (!["gemini", "claude"].includes(agent)) return { success: false, error: "Invalid agent" };
    
    try {
      await Bun.write("ralph-runner.log", `🚀 Launching ${agent} lifecycle...\n`);
      const logFile = Bun.file("ralph-runner.log");
      
      const proc = Bun.spawn(["bash", "scripts/run-loop.sh", agent, prompt, String(max_iterations), completion_promise, model], {
        stdout: logFile,
        stderr: logFile,
        stdin: "ignore"
      });
      
      // Save PID for precise control
      await Bun.write(".gemini/runner.pid", String(proc.pid));
      
      return { success: true };
    } catch (e) {
      console.error(e);
      return { success: false, error: "Failed to spawn" };
    }
  });

// Catch-all route for SSR (must be last)
app.all('*', async (context) => {
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

if (process.env.NODE_ENV !== 'test') {
  app.listen({ port: 3000, hostname: '0.0.0.0' });
  console.log(`🦊 Ralph Commander (SSR) is running at http://localhost:3000`);
}
