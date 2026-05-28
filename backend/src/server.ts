import http from "node:http";
import { env } from "@/config/env.js";
import { connectDatabase, disconnectDatabase } from "@/config/database.js";
import { closeRedisConnection } from "@/config/redis.js";
import { createApp } from "@/app.js";
import { ensureDemoUser } from "@/services/auth.service.js";
import { initSocket, subscribeSocketToProgressEvents } from "@/sockets/socket.js";
import { createGenerationWorker } from "@/workers/generation.worker.js";
import { createPdfWorker } from "@/workers/pdf.worker.js";

async function bootstrap() {
  await connectDatabase();
  await ensureDemoUser();

  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);
  const progressSubscriber = subscribeSocketToProgressEvents();

  let generationWorker: any = null;
  let pdfWorker: any = null;

  // Run BullMQ workers in-process in development by default, or if explicitly enabled in production
  const runWorkers = (env.NODE_ENV === "development" && process.env.DISABLE_IN_PROCESS_WORKERS !== "true") ||
    (process.env.RUN_WORKERS_IN_PROCESS === "true");

  if (runWorkers) {
    generationWorker = createGenerationWorker();
    pdfWorker = createPdfWorker();

    generationWorker.on("failed", (job: any, error: any) => {
      process.stderr.write(`Generation job ${job?.id ?? "unknown"} failed: ${error.message}\n`);
    });

    pdfWorker.on("failed", (job: any, error: any) => {
      process.stderr.write(`PDF job ${job?.id ?? "unknown"} failed: ${error.message}\n`);
    });

    process.stdout.write("VedaAI background workers started in-process\n");
  } else {
    process.stdout.write("VedaAI running in dedicated web server mode (workers disabled in-process)\n");
  }

  server.listen(env.PORT, () => {
    process.stdout.write(`VedaAI backend listening on http://localhost:${env.PORT}\n`);
  });

  async function shutdown() {
    server.close();
    if (generationWorker) await generationWorker.close();
    if (pdfWorker) await pdfWorker.close();
    await progressSubscriber.quit();
    await closeRedisConnection();
    await disconnectDatabase();
    process.exit(0);
  }

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

void bootstrap().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});
