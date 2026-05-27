import { api } from "@/services/api";
import type { LoginResponse } from "@/types/auth";

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export async function loginRequest(email: string, password: string) {
  const { data } = await api.post<ApiResponse<LoginResponse>>("/auth/login", {
    email,
    password
  });

  return data.data;
}

export async function registerRequest(email: string, password: string, name: string, schoolName: string) {
  const { data } = await api.post<ApiResponse<LoginResponse>>("/auth/register", {
    email,
    password,
    name,
    schoolName
  });

  return data.data;
}

export async function fetchDemoCredentials() {
  const { data } = await api.get<ApiResponse<{ email: string; password: string }>>("/auth/demo-credentials");
  return data.data;
}

