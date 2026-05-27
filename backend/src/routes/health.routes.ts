import { Router } from "express";
import mongoose from "mongoose";
import { getRedisConnection } from "@/config/redis.js";

export const healthRouter = Router();

healthRouter.get("/", async (_req, res) => {
  let mongoStatus = "disconnected";
  let redisStatus = "disconnected";

  try {
    if (mongoose.connection.readyState === 1) {
      mongoStatus = "connected";
    }
  } catch {
    mongoStatus = "error";
  }

  try {
    const pong = await getRedisConnection().ping();
    redisStatus = pong === "PONG" ? "connected" : "error";
  } catch {
    redisStatus = "error";
  }

  const allHealthy = mongoStatus === "connected" && redisStatus === "connected";

  res.status(allHealthy ? 200 : 503).json({
    success: allHealthy,
    data: {
      status: allHealthy ? "ok" : "degraded",
      service: "vedai-backend",
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      mongo: mongoStatus,
      redis: redisStatus
    }
  });
});
