import { useMemo, useState } from "react";
import type { Task, TaskPriority, TaskStatus } from "../types";
import { filterTasks, sortTasks, type TaskFilters } from "../utils/taskFilters";

/** View-only adapter: keeps search/filter state out of board layout and API state. */
export function useTaskView(tasks: Task[]) {
  const [filters, setFilters] = useState<TaskFilters>({});
  const [query, setQuery] = useState("");
  const setSearch = (value: string) => {
    setQuery(value);
    setFilters((current) => ({ ...current, query: value }));
  };
  const setStatus = (status: TaskStatus | "ALL") =>
    setFilters((current) => ({ ...current, status }));
  const setPriority = (priority: TaskPriority | "ALL") =>
    setFilters((current) => ({ ...current, priority }));
  const setOverdue = (overdue: boolean) =>
    setFilters((current) => ({ ...current, overdue }));
  const clearFilters = () => {
    setQuery("");
    setFilters({});
  };
  const visibleTasks = useMemo(() => sortTasks(filterTasks(tasks, filters)), [tasks, filters]);
  return { filters, query, visibleTasks, setSearch, setStatus, setPriority, setOverdue, clearFilters };
}
