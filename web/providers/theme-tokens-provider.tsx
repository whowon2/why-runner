"use client";

import { useTheme } from "next-themes";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { applyTheme } from "@/lib/themes/apply-theme";
import { cssColorToHex } from "@/lib/themes/color";
import { withCustomTokens } from "@/lib/themes/custom";
import {
  derivePalette,
  type ResolvedTheme,
  resolveTheme,
} from "@/lib/themes/palette";
import { bindPreference, savePreference } from "@/lib/preferences-sync";
import { DEFAULT_PRESET_ID, getPresetById } from "@/lib/themes/presets";
import { readStoredTheme, writeStoredTheme } from "@/lib/themes/storage";
import type { StoredTheme, ThemeMode, ThemeTokens } from "@/lib/themes/types";

type ThemeTokensContextValue = {
  stored: StoredTheme;
  activeMode: ThemeMode;
  activeTokens: ThemeTokens;
  /** What's on screen: `stored`, or the previewed preset, with its palette. */
  shown: ResolvedTheme;
  setPreset: (presetId: string) => void;
  /** Commits `tokens` (hex) as the custom theme's `mode` colors. */
  setCustomTokens: (tokens: ThemeTokens, mode: ThemeMode) => void;
  /**
   * Paints custom tokens on `<html>` without touching React state, storage or
   * the account; for live previews while editing. Call `setCustomTokens` to
   * commit them (that re-applies the stored theme).
   */
  paintCustomTokens: (tokens: ThemeTokens, mode: ThemeMode) => void;
  // Temporarily shows a preset without persisting it; null restores `stored`.
  previewPreset: (presetId: string | null) => void;
};

const ThemeTokensContext = createContext<ThemeTokensContextValue | null>(null);

function defaultStoredTheme(): StoredTheme {
  return { mode: "preset", presetId: DEFAULT_PRESET_ID };
}

function tokensFor(stored: StoredTheme, mode: ThemeMode): ThemeTokens {
  if (stored.mode === "preset") {
    return getPresetById(stored.presetId)[mode];
  }
  return stored.custom[mode];
}

export function ThemeTokensProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();
  const activeMode: ThemeMode = resolvedTheme === "light" ? "light" : "dark";
  const [stored, setStored] = useState<StoredTheme>(defaultStoredTheme);
  const [previewId, setPreviewId] = useState<string | null>(null);
  // Latest `stored`, so setters can derive the next value outside a setState
  // updater (updaters must stay pure: StrictMode runs them twice).
  const storedRef = useRef(stored);
  useLayoutEffect(() => {
    storedRef.current = stored;
  }, [stored]);

  useEffect(() => {
    const fromStorage = readStoredTheme();
    if (fromStorage) setStored(fromStorage);
  }, []);

  useEffect(
    () =>
      bindPreference("theme", {
        readLocal: () => readStoredTheme() ?? undefined,
        apply: (theme) => {
          setStored(theme);
          writeStoredTheme(theme);
        },
      }),
    [],
  );

  const shown = useMemo(
    () =>
      resolveTheme(
        previewId ? { mode: "preset", presetId: previewId } : stored,
        activeMode,
      ),
    [stored, previewId, activeMode],
  );

  // Layout effect: applied before any child's effect reads the new colors
  // (the code editor rebuilds its Monaco theme in one).
  useLayoutEffect(() => applyTheme(shown), [shown]);

  const setPreset = useCallback((presetId: string) => {
    const next: StoredTheme = { mode: "preset", presetId };
    setStored(next);
    setPreviewId(null);
    writeStoredTheme(next);
    savePreference({ theme: next });
  }, []);

  const setCustomTokens = useCallback(
    (tokens: ThemeTokens, mode: ThemeMode) => {
      const next = withCustomTokens(
        storedRef.current,
        mode,
        tokens,
        cssColorToHex,
      );
      storedRef.current = next;
      setStored(next);
      writeStoredTheme(next);
      savePreference({ theme: next });
    },
    [],
  );

  const paintCustomTokens = useCallback(
    (tokens: ThemeTokens, mode: ThemeMode) =>
      applyTheme({ tokens, palette: derivePalette(tokens, mode) }),
    [],
  );

  const activeTokens = useMemo(
    () => tokensFor(stored, activeMode),
    [stored, activeMode],
  );

  const value = useMemo(
    () => ({
      stored,
      activeMode,
      activeTokens,
      shown,
      setPreset,
      setCustomTokens,
      paintCustomTokens,
      previewPreset: setPreviewId,
    }),
    [
      stored,
      activeMode,
      activeTokens,
      shown,
      setPreset,
      setCustomTokens,
      paintCustomTokens,
    ],
  );

  return (
    <ThemeTokensContext.Provider value={value}>
      {children}
    </ThemeTokensContext.Provider>
  );
}

export function useThemeTokens() {
  const ctx = useContext(ThemeTokensContext);
  if (!ctx) {
    throw new Error("useThemeTokens must be used within ThemeTokensProvider");
  }
  return ctx;
}
