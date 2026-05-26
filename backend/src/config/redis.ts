import { Redis } from "ioredis";
import { env } from "@/config/env.js";

let redisConnection: Redis | null = null;

export function getRedisConnection() {
  if (!redisConnection) {
    redisConnection = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false
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
