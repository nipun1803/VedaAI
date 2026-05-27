import type { Request, Response } from "express";
import { env } from "@/config/env.js";
import { loginTeacher, registerTeacher } from "@/services/auth.service.js";
import { asyncHandler } from "@/utils/asyncHandler.js";

export const login = asyncHandler(async (req: Request, res: Response) => {
  const data = await loginTeacher(req.body);
  
  res.cookie("token", data.token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({
    success: true,
    data
  });
});

export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = await registerTeacher(req.body);

  res.cookie("token", data.token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({
    success: true,
    data
  });
});

export const getDemoCredentials = asyncHandler(async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      email: env.DEMO_EMAIL,
      password: env.DEMO_PASSWORD
    }
  });
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  res.json({
    success: true,
    data: req.user
  });
});

