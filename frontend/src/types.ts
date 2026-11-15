export type TaskStatus =
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "DONE"
  | "BACKLOG"
  | "ARCHIVED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";
export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  color: string;
  order: number;
  createdAt: string;
  dueDate: string;
  updatedAt: string;
}
export interface StatusColumn {
  key: Exclude<TaskStatus, "BACKLOG" | "ARCHIVED">;
  title: string;
  accent: string;
}
export const STATUS_COLUMNS: StatusColumn[] = [
  { key: "ASSIGNED", title: "Назначено", accent: "#6d5dfc" },
  { key: "IN_PROGRESS", title: "В работе", accent: "#1687ff" },
  { key: "DONE", title: "Завершено", accent: "#21b36b" },
];
export const STATUS_LABELS: Record<TaskStatus, string> = {
  ASSIGNED: "Назначено",
  IN_PROGRESS: "В работе",
  DONE: "Завершено",
  BACKLOG: "Бэклог",
  ARCHIVED: "Архив",
};
export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  LOW: "Низкий",
  MEDIUM: "Средний",
  HIGH: "Высокий",
};
