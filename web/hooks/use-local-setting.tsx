import { useCallback, useSyncExternalStore } from "react";

/**
 * A per-browser setting kept in `localStorage`, shared live by every
 * component that reads it (and by other tabs). When storage throws (blocked
 * site data, private mode) the value lives in memory for the current page.
 */
export function createLocalSetting<T>(
  key: string,
  parse: (stored: string | null) => T,
  serialize: (value: T) => string,
  fallback: T,
) {
  const listeners = new Set<() => void>();
  let memoryValue: { value: T } | null = null;
  // useSyncExternalStore needs a stable snapshot; cache the parsed value per
  // raw string.
  let cache: { raw: string | null; value: T } | null = null;

  function read(): T {
    if (memoryValue) return memoryValue.value;
    try {
      const raw = localStorage.getItem(key);
      if (!cache || cache.raw !== raw) cache = { raw, value: parse(raw) };
      return cache.value;
    } catch {
      return fallback;
    }
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    // Another tab changed the setting.
    window.addEventListener("storage", listener);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", listener);
    };
  }

  function write(value: T) {
    try {
      localStorage.setItem(key, serialize(value));
    } catch {
      memoryValue = { value };
    }
    for (const listener of listeners) listener();
  }

  return function useLocalSetting() {
    const value = useSyncExternalStore(subscribe, read, () => fallback);
    const setValue = useCallback((next: T) => write(next), []);
    return [value, setValue] as const;
  };
}
