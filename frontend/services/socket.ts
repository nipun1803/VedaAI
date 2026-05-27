"use client";

import { io, type Socket } from "socket.io-client";
import { isDemoMode } from "@/lib/env";

import { useAuthStore } from "@/store/authStore";

let socket: Socket | null = null;

export function getSocket() {
  if (typeof window === "undefined") return null;
  if (isDemoMode) return null;
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000", {
      transports: ["websocket"],
      autoConnect: false,
      withCredentials: true,
      auth: (cb) => {
        const token = useAuthStore.getState().token;
        cb({ token });
      }
    });
  }
  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
