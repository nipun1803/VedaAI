import { Redis } from "ioredis";
import { env } from "@/config/env.js";

let redisConnection: Redis | null = null;

export function getRedisConnection() {
  if (!redisConnection) {
    redisConnection = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false
    });

    // Register active Redis event observers to prevent silent connection failures
    redisConnection.on("error", (error) => {
      process.stderr.write(`Redis connection failure: ${error.message}\n`);
    });

    redisConnection.on("connect", () => {
      process.stdout.write("Redis client connected successfully\n");
    });

    redisConnection.on("reconnecting", () => {
      process.stdout.write("Redis client is attempting to reconnect to server...\n");
    });
  }

  return redisConnection;
}

export async function closeRedisConnection() {
  if (redisConnection) {
    await redisConnection.quit();
    redisConnection = null;
  }
}
