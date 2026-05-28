import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  MONGODB_URI: z.string().min(1).default("mongodb://localhost:27017/vedai"),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(24).default("vedai-local-development-secret-change-me"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  DEMO_EMAIL: z.string().email().default("teacher@vedai.demo"),
  DEMO_PASSWORD: z.string().min(8).default("VedaAI@123"),
  DEMO_NAME: z.string().default("John Doe"),
  DEMO_SCHOOL: z.string().default("Delhi Public School, Sector-4, Bokaro"),
  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL: z.string().default("llama-3.3-70b-versatile"),
  AI_TIMEOUT_MS: z.coerce.number().default(60000),
  AI_MAX_RETRIES: z.coerce.number().default(2)
});

export const env = envSchema.parse(process.env);

