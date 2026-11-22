import type { Task, TaskPriority, TaskStatus } from "../types";

export interface TaskFilters {
  query?: string;
  status?: TaskStatus | "ALL";
  priority?: TaskPriority | "ALL";
  overdue?: boolean;
}

const normalize = (value: string | undefined) => value?.trim().toLocaleLowerCase() ?? "";

/** Pure, reusable filtering for board, backlog and archive collections. */
export function filterTasks(tasks: Task[], filters: TaskFilters = {}): Task[] {
  const query = normalize(filters.query);
  return tasks.filter((task) => {
    if (filters.status && filters.status !== "ALL" && task.status !== filters.status) return false;
    if (filters.priority && filters.priority !== "ALL" && task.priority !== filters.priority) return false;
    if (filters.overdue && (task.status === "ARCHIVED" || new Date(task.dueDate).getTime() >= Date.now())) return false;
    if (!query) return true;
    return [task.title, task.description, String(task.id)]
      .some((value) => normalize(value).includes(query));
  });
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => a.order - b.order || a.id - b.id);
}
