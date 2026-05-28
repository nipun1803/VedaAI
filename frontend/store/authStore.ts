"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isDemoMode } from "@/lib/env";
import { loginRequest, registerRequest } from "@/services/authApi";
import type { AuthUser } from "@/types/auth";

export const demoCredentials = {
  email: "teacher@vedai.demo",
  password: "VedaAI@123"
};

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, schoolName: string) => Promise<void>;
  logout: () => void;
}

const demoUser: AuthUser = {
  id: "demo-teacher",
  email: demoCredentials.email,
  name: "John Doe",
  schoolName: "Delhi Public School, Sector-4, Bokaro",
  role: "teacher"
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: async (email, password) => {
        if (isDemoMode) {
          if (email !== demoCredentials.email || password !== demoCredentials.password) {
            throw new Error("Use the demo credentials to enter the preview workspace.");
          }

          set({
            user: demoUser,
            token: "demo-token",
            isAuthenticated: true
          });
          return;
        }

        const data = await loginRequest(email, password);
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true
        });
      },
      register: async (email, password, name, schoolName) => {
        if (isDemoMode) {
          throw new Error("Registration is disabled in demo preview mode.");
        }

        const data = await registerRequest(email, password, name, schoolName);
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true
        });
      },
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
      }
    }),
    {
      name: "vedai-auth-store"
    }
  )
);

