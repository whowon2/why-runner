import { useCallback, useSyncExternalStore } from "react";

// One size for every code editor, remembered across visits and tabs.
const STORAGE_KEY = "whyrunner:editor-font-size";
export const EDITOR_FONT_SIZE_MIN = 10;
export const EDITOR_FONT_SIZE_MAX = 32;
export const EDITOR_FONT_SIZE_DEFAULT = 14;

const listeners = new Set<() => void>();
// Used when localStorage throws (blocked site data, private mode), so the
// controls still work for the current page.
let memorySize: number | null = null;

function clamp(size: number) {
  return Math.min(EDITOR_FONT_SIZE_MAX, Math.max(EDITOR_FONT_SIZE_MIN, size));
}

function read(): number {
  if (memorySize !== null) return memorySize;
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isInteger(stored) && stored > 0
      ? clamp(stored)
      : EDITOR_FONT_SIZE_DEFAULT;
  } catch {
    return EDITOR_FONT_SIZE_DEFAULT;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Another tab changed the size.
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function useEditorFontSize() {
  const fontSize = useSyncExternalStore(
    subscribe,
    read,
    () => EDITOR_FONT_SIZE_DEFAULT,
  );

  const setFontSize = useCallback((size: number) => {
    const next = clamp(size);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      memorySize = next;
    }
    for (const listener of listeners) listener();
  }, []);

  return { fontSize, setFontSize };
}
