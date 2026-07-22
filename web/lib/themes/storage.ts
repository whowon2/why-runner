import type { StoredTheme } from "./types";

export const THEME_STORAGE_KEY = "why-runner:theme";

export function readStoredTheme(): StoredTheme | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredTheme;
  } catch {
    return null;
  }
}

export function writeStoredTheme(theme: StoredTheme) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(theme));
}
