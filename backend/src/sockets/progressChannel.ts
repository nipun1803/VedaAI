import { Redis } from "ioredis";
import { env } from "@/config/env.js";
import { getRedisConnection } from "@/config/redis.js";
import type { SocketProgressEvent } from "@/types/assessment.js";

export const GENERATION_EVENTS_CHANNEL = "vedai:generation-events";

export async function publishGenerationUpdate(event: SocketProgressEvent) {
  await getRedisConnection().publish(GENERATION_EVENTS_CHANNEL, JSON.stringify(event));
}

export function createProgressSubscriber(onEvent: (event: SocketProgressEvent) => void) {
  const subscriber = new Redis(env.REDIS_URL);

  subscriber.subscribe(GENERATION_EVENTS_CHANNEL).catch(() => {
    // Subscription errors surface through the Redis client error event.
  });

  subscriber.on("message", (_channel: string, message: string) => {
    try {
      onEvent(JSON.parse(message) as SocketProgressEvent);
    } catch {
      // Ignore malformed external pub/sub messages.
    }
  });

  return subscriber;
}
