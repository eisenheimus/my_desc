import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
import type { Task, TaskPriority, TaskStatus } from "../types";

export interface TaskDataState {
  tasks: Task[];
  backlog: Task[];
  archived: Task[];
  loading: boolean;
  saving: boolean;
  error: Error | null;
}

export interface TaskPayload {
  title: string;
  description: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  color?: string;
  createdAt?: string;
  dueDate?: string;
}

/**
 * Owns the server-backed task collections and keeps stale responses from
 * updating the UI after a reload or unmount. API paths and payloads remain in
 * api.ts; this hook is deliberately a thin state/invalidation layer.
 */
export function useTaskData() {
  const [state, setState] = useState<TaskDataState>({
    tasks: [],
    backlog: [],
    archived: [],
    loading: true,
    saving: false,
    error: null,
  });
  const mounted = useRef(true);
  const requestId = useRef(0);

  useEffect(() => () => {
    mounted.current = false;
  }, []);

  const load = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const [tasks, backlog, archived] = await Promise.all([
        api.list(),
        api.backlog(),
        api.archived(),
      ]);
      if (!mounted.current || currentRequest !== requestId.current) return;
      setState((current) => ({
        ...current,
        tasks,
        backlog,
        archived,
        loading: false,
        error: null,
      }));
    } catch (error) {
      if (!mounted.current || currentRequest !== requestId.current) return;
      setState((current) => ({
        ...current,
        loading: false,
        error: error instanceof Error ? error : new Error("Не удалось загрузить задачи"),
      }));
      throw error;
    }
  }, []);

  useEffect(() => {
    void load().catch(() => undefined);
  }, [load]);

  const mutate = useCallback(
    async (operation: () => Promise<unknown>) => {
      setState((current) => ({ ...current, saving: true, error: null }));
      try {
        await operation();
        await load();
      } catch (error) {
        if (mounted.current) {
          setState((current) => ({
            ...current,
            saving: false,
            error: error instanceof Error ? error : new Error("Не удалось сохранить задачу"),
          }));
        }
        throw error;
      }
      if (mounted.current) setState((current) => ({ ...current, saving: false }));
    },
    [load],
  );

  const create = useCallback((payload: TaskPayload) => mutate(() => api.create(payload)), [mutate]);
  const update = useCallback(
    (id: number, payload: Partial<TaskPayload>) => mutate(() => api.update(id, payload)),
    [mutate],
  );
  const remove = useCallback((id: number) => mutate(() => api.remove(id)), [mutate]);
  const archive = useCallback((id: number) => mutate(() => api.archive(id)), [mutate]);
  const restore = useCallback((id: number) => mutate(() => api.restore(id)), [mutate]);
  const move = useCallback(
    (id: number, status: TaskStatus, order: number, color?: string) =>
      mutate(() => api.move(id, status, order, color)),
    [mutate],
  );

  return {
    ...state,
    load,
    create,
    update,
    remove,
    archive,
    restore,
    move,
  };
}
