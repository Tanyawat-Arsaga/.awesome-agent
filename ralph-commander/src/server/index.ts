import { join } from 'path';
import { Elysia } from 'elysia';
import { staticPlugin } from '@elysiajs/static';
import { cors } from '@elysiajs/cors';
import { connect } from 'elysia-connect-middleware';
import { getRalphStatus, getRalphTasks, watchRalphFiles, toggleRalphTask } from './services/ralph';

const isProduction = process.env.NODE_ENV === 'production';
const root = process.cwd();

const app = new Elysia()
  .use(cors())
  .ws('/ws', {
    open(ws) {
      ws.subscribe('ralph-updates');
      getRalphStatus().then(s => s && ws.send(JSON.stringify({ type: 'status', data: s })));
    },
    message(ws, msg: any) { if (msg === 'ping') ws.send(JSON.stringify({ type: 'pong' })); },
    close(ws) { ws.unsubscribe('ralph-updates'); }
  });

watchRalphFiles((type, data) => app.server?.publish('ralph-updates', JSON.stringify({ type, data })));

app.group('/api', (api) => 
  api
    .get("/health", () => ({ status: "ok" }))
    .get("/ralph/status", async () => {
      const s = await getRalphStatus();
      let stats = {};
      try {
        const statsFile = Bun.file(".gemini/stats.json");
        if (await statsFile.exists()) stats = (await statsFile.json()).stats || {};
      } catch {} // eslint-disable-line
      return { ...(s || { active: false }), stats };
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
        return output.split("\n").filter(l => l.trim()).map(line => ({ status: line.slice(0, 2).trim(), path: line.slice(3).trim() }));
      } catch { return []; } // eslint-disable-line
    })
    .get("/agent/models", async () => {
      try {
        const proc = Bun.spawn(["gemini", "hello", "-o", "json", "--yolo"], { stdout: "pipe", stderr: "ignore" });
        const text = await new Response(proc.stdout).text();
        if (!text || !text.trim().startsWith("{")) throw new Error();
        return { success: true, models: Object.keys(JSON.parse(text).stats?.models || {}) };
      } catch {
        return { success: true, models: ["auto", "pro", "flash", "flash-lite"], is_fallback: true };
      } // eslint-disable-line
    })
    .get("/ralph/logs", async () => {
      try {
        const file = Bun.file("ralph-runner.log");
        return await file.exists() ? await file.text() : "";
      } catch { return ""; } // eslint-disable-line
    })
    .delete("/ralph/logs", async () => {
      await Bun.write("ralph-runner.log", "");
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
          try { process.kill(-parseInt(pid.trim()), 'SIGTERM'); } catch (e) {
            try { process.kill(parseInt(pid.trim()), 'SIGTERM'); } catch(e2) {}
          }
        }
        await Bun.write(".gemini/runner.pid", "");
      }
      return { success: true };
    })
    .post("/ralph/start", async ({ body }: any) => {
      const { prompt, max_iterations, completion_promise, agent = "gemini", model = "", resume = false } = body;
      if (!prompt && !resume) return { success: false, error: "Prompt is required" };
      await Bun.write("ralph-runner.log", `🚀 Launching ${agent} lifecycle...\n`);
      const logFile = Bun.file("ralph-runner.log");
      const args = ["bash", "scripts/run-loop.sh", agent, prompt, String(max_iterations), completion_promise, model];
      if (resume) args.push("--resume");
      const proc = Bun.spawn(args, { stdout: logFile, stderr: logFile, stdin: "ignore" });
      await Bun.write(".gemini/runner.pid", String(proc.pid));
      return { success: true };
    })
);

if (!isProduction && process.env.NODE_ENV !== 'test') {
  const { createDevMiddleware } = await import('vike/server');
  const { devMiddleware } = await createDevMiddleware({ root });
  app.use(connect(devMiddleware));
} else if (isProduction) {
  app.use(staticPlugin({ assets: join(root, 'dist', 'client'), prefix: '/' }));
}

if (process.env.NODE_ENV !== 'test') {
  app.all('*', async (ctx) => {
    const url = new URL(ctx.request.url);
    if (url.pathname === '/ws' || url.pathname.startsWith('/api')) return;
    const { renderPage } = await import('vike/server');
    const pageContext = await renderPage({ urlOriginal: ctx.request.url, headers: Object.fromEntries(ctx.request.headers.entries()) });
    if (!pageContext.httpResponse) return ctx.set.status = 404;
    const { body, statusCode, headers } = pageContext.httpResponse;
    return new Response(body, { status: statusCode, headers: headers as HeadersInit });
  });
}

if (import.meta.main) {
  app.listen({ port: 3000, hostname: '0.0.0.0' });
  console.log(`🦊 Ralph Commander (SSR) is running at http://localhost:3000`);
}

export { app };
