import axios from "axios";
import type { Assignment, AssignmentDraft, GeneratedPaper } from "@/types/assignment";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api",
  timeout: 20000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json"
  }
});

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;

  const persisted = window.localStorage.getItem("vedai-auth-store");
  if (!persisted) return config;

  try {
    const parsed = JSON.parse(persisted) as { state?: { token?: string | null } };
    const token = parsed.state?.token;
    if (token && token !== "demo-token") {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    return config;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        console.warn("Unauthorized request detected (401). Clearing stale session.");
        window.localStorage.removeItem("vedai-auth-store");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export async function createAssignmentRequest(payload: AssignmentDraft) {
  const { data } = await api.post<ApiResponse<{ assignment: Assignment }>>("/assignments", payload);
  return data.data.assignment;
}

export async function listAssignmentsRequest() {
  const { data } = await api.get<ApiResponse<{ assignments: Assignment[] }>>("/assignments");
  return data.data.assignments;
}

export async function getAssignmentRequest(id: string) {
  const { data } = await api.get<ApiResponse<{ assignment: Assignment; paper: GeneratedPaper | null }>>(
    `/assignments/${id}`
  );
  return data.data;
}

export async function regenerateAssignmentRequest(id: string) {
  const { data } = await api.post<ApiResponse<{ assignment: Assignment }>>(`/assignments/${id}/regenerate`);
  return data.data.assignment;
}

export async function downloadAssignmentPdfRequest(id: string) {
  const { data } = await api.get<Blob>(`/assignments/${id}/pdf`, {
    responseType: "blob"
  });
  return data;
}

export async function uploadFileRequest(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await api.post<ApiResponse<{ fileName: string; textContext: string }>>("/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return data.data;
}

export async function getJobStatusRequest(assignmentId: string) {
  const { data } = await api.get<ApiResponse<{ status: string; progress: number; message: string; stage: string }>>(
    `/jobs/assignments/${assignmentId}/status`
  );
  return data.data;
}

export interface StudentGroup {
  id: string;
  name: string;
  studentsCount: number;
  teacherId: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function listGroupsRequest(archived = false) {
  const { data } = await api.get<ApiResponse<{ groups: StudentGroup[] }>>(`/groups?archived=${archived}`);
  return data.data.groups;
}

export async function createGroupRequest(payload: { name: string; studentsCount?: number }) {
  const { data } = await api.post<ApiResponse<{ group: StudentGroup }>>("/groups", payload);
  return data.data.group;
}

export async function toggleGroupArchiveRequest(id: string) {
  const { data } = await api.post<ApiResponse<{ group: StudentGroup }>>(`/groups/${id}/toggle-archive`);
  return data.data.group;
}

export async function deleteGroupRequest(id: string) {
  const { data } = await api.delete<ApiResponse<{ success: boolean; message: string }>>(`/groups/${id}`);
  return data.data;
}
