import { join } from 'path';
import { Elysia } from 'elysia';
import { staticPlugin } from '@elysiajs/static';
import { cors } from '@elysiajs/cors';
import { connect } from 'elysia-connect-middleware';
import { renderPage } from 'vike/server';
import { getRalphStatus } from './services/ralph';

// Configuration
const isProduction = process.env.NODE_ENV === 'production';
const root = process.cwd();

export const app = new Elysia()
  .use(cors());

// Vike SSR Development Middleware
if (!isProduction) {
  const { createDevMiddleware } = await import('vike/server');
  const { devMiddleware } = await createDevMiddleware({ root });
  app.use(connect(devMiddleware));
} else {
  // Production: Serve static assets
  app.use(
    staticPlugin({
      assets: join(root, 'dist', 'client'),
      prefix: '/'
    })
  );
}

// API Routes
app
  .get("/api/health", () => ({ status: "ok" }))
  .get("/api/ralph/status", async () => await getRalphStatus())
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
      // Use Bun.write to overwrite with empty string
      await Bun.write("ralph-runner.log", "");
      return { success: true };
    } catch (e) { 
      console.error(e);
      return { success: false, error: "Failed to clear logs" }; 
    }
  })
  .post("/api/ralph/stop", async () => {
    try {
      // 1. Mark state file inactive so runner exits loop
      const stateFile = ".gemini/ralph-loop.local.md";
      const content = await Bun.file(stateFile).text();
      const updated = content.replace("active: true", "active: false");
      await Bun.write(stateFile, updated);

      // 2. Kill the runner and children
      Bun.spawn(["pkill", "-f", "scripts/run-loop.sh"]);
      Bun.spawn(["pkill", "-f", "gemini"]);
      Bun.spawn(["pkill", "-f", "claude"]);
      
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
      // Clear logs first
      await Bun.write("ralph-runner.log", `🚀 Launching ${agent} loop...\n`);
      
      const logFile = Bun.file("ralph-runner.log");
      
      Bun.spawn(["bash", "scripts/run-loop.sh", agent, prompt, String(max_iterations), completion_promise, model], {
        stdout: logFile,
        stderr: logFile,
        stdin: "ignore"
      });
      
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