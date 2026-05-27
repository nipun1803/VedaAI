import { connectDatabase } from "@/config/database.js";
import { closeRedisConnection } from "@/config/redis.js";
import { createGenerationWorker } from "@/workers/generation.worker.js";
import { createPdfWorker } from "@/workers/pdf.worker.js";

async function startWorkers() {
  await connectDatabase();

  const generationWorker = createGenerationWorker();
  const pdfWorker = createPdfWorker();

  generationWorker.on("failed", (job, error) => {
    process.stderr.write(`Generation job ${job?.id ?? "unknown"} failed: ${error.message}\n`);
  });

  pdfWorker.on("failed", (job, error) => {
    process.stderr.write(`PDF job ${job?.id ?? "unknown"} failed: ${error.message}\n`);
  });

  process.stdout.write("VedaAI workers are running\n");

  async function shutdown() {
    await generationWorker.close();
    await pdfWorker.close();
    await closeRedisConnection();
    process.exit(0);
  }

  process.on("SIGINT", () => void shutdown());
  process.on("SIGTERM", () => void shutdown());
}

void startWorkers().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.stack : String(error)}\n`);
  process.exit(1);
});

