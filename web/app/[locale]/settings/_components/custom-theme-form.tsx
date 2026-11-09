"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cssColorToHex } from "@/lib/themes/color";
import { editableTokens } from "@/lib/themes/custom";
import {
  TOKEN_KEYS,
  type ThemeMode,
  type ThemeTokens,
} from "@/lib/themes/types";
import { isValidHexColor } from "@/lib/themes/validate";
import { useThemeTokens } from "@/providers/theme-tokens-provider";

const TOKEN_LABELS: Record<(typeof TOKEN_KEYS)[number], string> = {
  background: "background",
  main: "main",
  text: "text",
  sub: "sub",
  caret: "caret",
  error: "error",
};

// Color pickers fire on every pointer move while dragging; the page repaints
// once per frame, while the theme is committed (state, localStorage, account)
// only after the edits pause.
const COMMIT_DELAY_MS = 200;

const FALLBACK_TOKENS: ThemeTokens = {
  background: "#111111",
  main: "#4ade80",
  text: "#eeeeee",
  sub: "#888888",
  caret: "#eeeeee",
  error: "#da3333",
};

function isHexTokens(tokens: ThemeTokens): boolean {
  return TOKEN_KEYS.every((key) => isValidHexColor(tokens[key]));
}

/** Previews and commits edits to `mode`'s colors (fixed for the form's life). */
function useLiveCustomTokens(mode: ThemeMode) {
  const { setCustomTokens, paintCustomTokens } = useThemeTokens();
  const latest = useRef({ setCustomTokens, paintCustomTokens });
  useLayoutEffect(() => {
    latest.current = { setCustomTokens, paintCustomTokens };
  }, [setCustomTokens, paintCustomTokens]);
  const pending = useRef<ThemeTokens | null>(null);
  const frame = useRef<number | undefined>(undefined);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flush = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = undefined;
    if (frame.current !== undefined) cancelAnimationFrame(frame.current);
    frame.current = undefined;
    const tokens = pending.current;
    pending.current = null;
    if (tokens) latest.current.setCustomTokens(tokens, mode);
  }, [mode]);

  const schedule = useCallback(
    (tokens: ThemeTokens) => {
      pending.current = tokens;
      frame.current ??= requestAnimationFrame(() => {
        frame.current = undefined;
        if (pending.current) {
          latest.current.paintCustomTokens(pending.current, mode);
        }
      });
      clearTimeout(timer.current);
      timer.current = setTimeout(flush, COMMIT_DELAY_MS);
    },
    [flush, mode],
  );

  // Leaving the form (or the page) mid-edit still commits the last value.
  useEffect(() => flush, [flush]);

  return { schedule, flush };
}

/**
 * Edits the custom theme's colors for the shown light/dark mode. Remount it
 * (`key`) when the mode changes: its fields belong to one mode.
 */
export function CustomThemeForm() {
  const { stored, activeMode } = useThemeTokens();
  const { schedule, flush } = useLiveCustomTokens(activeMode);

  const [fields, setFields] = useState<ThemeTokens>(
    () => editableTokens(stored, activeMode, cssColorToHex) ?? FALLBACK_TOKENS,
  );

  function handleChange(key: (typeof TOKEN_KEYS)[number], value: string) {
    const next = { ...fields, [key]: value };
    setFields(next);

    if (isHexTokens(next)) schedule(next);
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {TOKEN_KEYS.map((key) => {
        const value = fields[key];
        const valid = isValidHexColor(value);

        return (
          <div key={key} className="flex flex-col gap-1.5">
            <Label htmlFor={`theme-token-${key}`}>{TOKEN_LABELS[key]}</Label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                aria-label={`${TOKEN_LABELS[key]} color picker`}
                value={valid ? value : "#000000"}
                onChange={(e) => handleChange(key, e.target.value)}
                onBlur={flush}
                className="size-9 border cursor-pointer shrink-0 bg-transparent p-0"
              />
              <Input
                id={`theme-token-${key}`}
                value={value}
                onChange={(e) => handleChange(key, e.target.value)}
                onBlur={flush}
                aria-invalid={!valid}
                className="font-mono"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
