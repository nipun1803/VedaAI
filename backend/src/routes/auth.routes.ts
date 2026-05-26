import { Router } from "express";
import { getDemoCredentials, login, me } from "@/controllers/auth.controller.js";
import { requireAuth } from "@/middlewares/auth.js";
import { authRateLimiter } from "@/middlewares/rateLimiter.js";
import { validateBody } from "@/middlewares/validateRequest.js";
import { loginBodySchema } from "@/validators/auth.validator.js";

export const authRouter = Router();

authRouter.get("/demo-credentials", getDemoCredentials);
authRouter.post("/login", authRateLimiter, validateBody(loginBodySchema), login);
authRouter.get("/me", requireAuth, me);

