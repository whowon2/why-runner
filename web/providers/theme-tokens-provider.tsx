"use client";

import { useTheme } from "next-themes";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { applyThemeTokens } from "@/lib/themes/apply-theme";
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
  setPreset: (presetId: string) => void;
  setCustomTokens: (tokens: ThemeTokens) => void;
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

  useEffect(() => {
    const fromStorage = readStoredTheme();
    if (fromStorage) setStored(fromStorage);
  }, []);

  useEffect(() => {
    applyThemeTokens(tokensFor(stored, activeMode));
  }, [stored, activeMode]);

  const setPreset = useCallback((presetId: string) => {
    const next: StoredTheme = { mode: "preset", presetId };
    setStored(next);
    writeStoredTheme(next);
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
    () => ({ stored, activeMode, activeTokens, setPreset, setCustomTokens }),
    [stored, activeMode, activeTokens, setPreset, setCustomTokens],
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
