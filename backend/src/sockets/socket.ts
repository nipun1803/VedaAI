import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { env } from "@/config/env.js";
import type { SocketProgressEvent } from "@/types/assessment.js";
import { createProgressSubscriber } from "@/sockets/progressChannel.js";

let io: Server | null = null;

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

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: {
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }
        const normalizedFrontend = env.FRONTEND_URL.replace(/\/$/, "");
        const allowedOrigins = new Set([normalizedFrontend, "http://localhost:3000", "http://localhost:3001"]);
        
        if (allowedOrigins.has(origin)) {
          callback(null, true);
          return;
        }

        const isVercelPreview = origin.endsWith(".vercel.app") && 
          (origin.includes("veda") || origin.includes("nipun1803"));
        
        if (isVercelPreview) {
          callback(null, true);
          return;
        }

        callback(null, false);
      },
      credentials: true
    }
  });

  io.use((socket, next) => {
    const authHeader = socket.handshake.headers.authorization;
    let token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

    if (!token && socket.handshake.auth?.token) {
      token = socket.handshake.auth.token;
    }

    if (!token && socket.handshake.headers.cookie) {
      const cookies = parseCookies(socket.handshake.headers.cookie);
      token = cookies.token;
    }

    if (!token) {
      return next(new Error("Authentication token is required"));
    }

    try {
      const payload = jwt.verify(token, env.JWT_SECRET);
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error("Invalid or expired authentication token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("join-assignment", (assignmentId: string) => {
      socket.join(`assignment:${assignmentId}`);
    });

    socket.on("leave-assignment", (assignmentId: string) => {
      socket.leave(`assignment:${assignmentId}`);
    });
  });

  return io;
}

export function emitGenerationUpdate(event: SocketProgressEvent) {
  io?.to(`assignment:${event.assignmentId}`).emit("generation:update", event);
}

export function subscribeSocketToProgressEvents() {
  return createProgressSubscriber((event) => {
    emitGenerationUpdate(event);
  });
}

