import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/** `value`, updated only after it has stayed the same for `delay` ms. */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);
  return debounced;
}

export type DebouncedCallback<Args extends unknown[]> = ((
  ...args: Args
) => void) & {
  /** Drops the pending call. */
  cancel: () => void;
  /** Runs the pending call now, if any. */
  flush: () => void;
};

/**
 * Stable function that calls the latest `fn` once calls stop for `delay` ms,
 * with the last arguments. A pending call is dropped on unmount.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number,
): DebouncedCallback<Args> {
  const latest = useRef(fn);
  useLayoutEffect(() => {
    latest.current = fn;
  });
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pending = useRef<Args | null>(null);

  const cancel = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
    pending.current = null;
  }, []);

  const flush = useCallback(() => {
    const args = pending.current;
    cancel();
    if (args) latest.current(...args);
  }, [cancel]);

  useEffect(() => cancel, [cancel]);

  return useMemo(() => {
    const debounced = (...args: Args) => {
      pending.current = args;
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, delay);
    };
    return Object.assign(debounced, { cancel, flush });
  }, [cancel, flush, delay]);
}
