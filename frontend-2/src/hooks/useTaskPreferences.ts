import { useEffect, useState } from "react";

const STORAGE_KEY = "my-desk.preferences";
export interface TaskPreferences {
  query: string;
  overdueColor: string;
  dueDays: number;
}
const defaults: TaskPreferences = { query: "", overdueColor: "#FFF0F0", dueDays: 14 };

function readPreferences(): TaskPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw) as Partial<TaskPreferences>;
    return {
      query: typeof parsed.query === "string" ? parsed.query : defaults.query,
      overdueColor: typeof parsed.overdueColor === "string" ? parsed.overdueColor : defaults.overdueColor,
      dueDays: typeof parsed.dueDays === "number" && parsed.dueDays > 0 ? parsed.dueDays : defaults.dueDays,
    };
  } catch {
    return defaults;
  }
}
export function useTaskPreferences() {
  const [preferences, setPreferences] = useState<TaskPreferences>(readPreferences);
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences)); } catch { /* storage unavailable */ }
  }, [preferences]);
  return { preferences, setPreferences };
}
