import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "@/config/env.js";
import { errorHandler } from "@/middlewares/errorHandler.js";
import { notFound } from "@/middlewares/notFound.js";
import { apiRateLimiter } from "@/middlewares/rateLimiter.js";
import { requestLogger } from "@/middlewares/requestLogger.js";
import { apiRouter } from "@/routes/index.js";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { questionGenerationQueue, pdfGenerationQueue } from "@/queues/generation.queue.js";

const getNormalizedOrigins = () => {
  const normalizedFrontend = env.FRONTEND_URL.replace(/\/$/, "");
  return new Set([normalizedFrontend, "http://localhost:3000", "http://localhost:3001"]);
};

export function createApp() {
  const app = express();

  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/api/admin/queues");

  createBullBoard({
    queues: [new BullMQAdapter(questionGenerationQueue), new BullMQAdapter(pdfGenerationQueue)],
    serverAdapter: serverAdapter
  });

  app.use(
    helmet({
      crossOriginResourcePolicy: {
        policy: "cross-origin"
      }
    })
  );
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }

        const allowedOrigins = getNormalizedOrigins();
        if (allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }

        // Support Vercel Preview Deployments dynamically
        const isVercelPreview = origin.endsWith(".vercel.app") && 
          (origin.includes("veda") || origin.includes("nipun1803"));
        
        if (isVercelPreview) {
          callback(null, true);
          return;
        }

        callback(null, false);
      },
      credentials: true
    })
  );
  app.use(express.json({ limit: "2mb" }));
  app.use(requestLogger);
  
  app.use("/api/admin/queues", serverAdapter.getRouter());
  app.use("/api", apiRateLimiter, apiRouter);
  
  app.use(notFound);
  app.use(errorHandler);

  return app;
}

