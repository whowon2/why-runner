"use client";

import { useTheme } from "next-themes";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
import { applyTheme } from "@/lib/themes/apply-theme";
import { type ResolvedTheme, resolveTheme } from "@/lib/themes/palette";
import { bindPreference, savePreference } from "@/lib/preferences-sync";
import { DEFAULT_PRESET_ID, getPresetById } from "@/lib/themes/presets";
import { readStoredTheme, writeStoredTheme } from "@/lib/themes/storage";
import type {
  CustomTheme,
  StoredTheme,
  ThemeMode,
  ThemeTokens,
} from "@/lib/themes/types";

type ThemeTokensContextValue = {
  stored: StoredTheme;
  activeMode: ThemeMode;
  activeTokens: ThemeTokens;
  /** What's on screen: `stored`, or the previewed preset, with its palette. */
  shown: ResolvedTheme;
  setPreset: (presetId: string) => void;
  setCustomTokens: (tokens: ThemeTokens) => void;
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
    (tokens: ThemeTokens) => {
      setStored((prev) => {
        const prevCustom: CustomTheme =
          prev.mode === "custom"
            ? prev.custom
            : {
                light: getPresetById(
                  prev.mode === "preset" ? prev.presetId : DEFAULT_PRESET_ID,
                ).light,
                dark: getPresetById(
                  prev.mode === "preset" ? prev.presetId : DEFAULT_PRESET_ID,
                ).dark,
              };
        const nextCustom: CustomTheme = {
          ...prevCustom,
          [activeMode]: tokens,
        };
        const next: StoredTheme = { mode: "custom", custom: nextCustom };
        writeStoredTheme(next);
        savePreference({ theme: next });
        return next;
      });
    },
    [activeMode],
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
      previewPreset: setPreviewId,
    }),
    [stored, activeMode, activeTokens, shown, setPreset, setCustomTokens],
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
