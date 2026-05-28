import http from "node:http";
import { env } from "@/config/env.js";
import { connectDatabase, disconnectDatabase } from "@/config/database.js";
import { closeRedisConnection } from "@/config/redis.js";
import { createApp } from "@/app.js";
import { ensureDemoUser } from "@/services/auth.service.js";
import { initSocket, subscribeSocketToProgressEvents } from "@/sockets/socket.js";

async function bootstrap() {
  await connectDatabase();
  await ensureDemoUser();

  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);
  const progressSubscriber = subscribeSocketToProgressEvents();

  server.listen(env.PORT, () => {
    process.stdout.write(`VedaAI backend listening on http://localhost:${env.PORT}\n`);
  });

  async function shutdown() {
    server.close();
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

