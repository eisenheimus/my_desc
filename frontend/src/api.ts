import type { Task, TaskPriority, TaskStatus } from "./types";
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(
  /\/$/,
  "",
);
const ACCESS_TOKEN = import.meta.env.VITE_TOKEN || "";
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path.replace(/^\/api/, "")}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      "x-access-token": ACCESS_TOKEN,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok)
    throw new Error((await res.text()) || `Request failed: ${res.status}`);
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
export const api = {
  list: () => request<Task[]>("/tasks"),
  backlog: () => request<Task[]>("/tasks/backlog"),
  archived: () => request<Task[]>("/tasks/archived"),
  create: (data: {
    title: string;
    description: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    color?: string;
    createdAt?: string;
    dueDate?: string;
  }) => request<Task>("/tasks", { method: "POST", body: JSON.stringify(data) }),
  update: (
    id: number,
    data: {
      title?: string;
      description?: string;
      status?: TaskStatus;
      priority?: TaskPriority;
      color?: string;
      createdAt?: string;
      dueDate?: string;
    },
  ) =>
    request<Task>(`/tasks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  move: (id: number, status: TaskStatus, order: number, color?: string) =>
    request<Task>(`/tasks/${id}/move`, {
      method: "PATCH",
      body: JSON.stringify({ status, order, color }),
    }),
  archive: (id: number) =>
    request<Task>(`/tasks/${id}/archive`, { method: "PATCH" }),
  restore: (id: number) =>
    request<Task>(`/tasks/${id}/restore`, { method: "PATCH" }),
  remove: (id: number) => request<Task>(`/tasks/${id}`, { method: "DELETE" }),
};
