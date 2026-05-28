import jwt from "jsonwebtoken";
import type { RequestHandler } from "express";
import { env } from "@/config/env.js";
import { AppError } from "@/utils/AppError.js";

interface JwtPayload {
  sub: string;
  email: string;
  name: string;
  schoolName: string;
  role: string;
}

function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.split("=");
    if (name) {
      list[name.trim()] = rest.join("=").trim();
    }
  }
  return list;
}

export const requireAuth: RequestHandler = (req, _res, next) => {
  const header = req.headers.authorization;
  let token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

  if (!token && req.headers.cookie) {
    const cookies = parseCookies(req.headers.cookie);
    token = cookies.token;
  }

  if (!token) {
    next(new AppError("Authentication token is required", 401, "AUTH_REQUIRED"));
    return;
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      schoolName: payload.schoolName,
      role: payload.role
    };
    next();
  } catch {
    next(new AppError("Invalid or expired authentication token", 401, "AUTH_INVALID"));
  }
};

