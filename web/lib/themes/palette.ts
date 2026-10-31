import { getPresetById } from "./presets";
import {
  type StoredTheme,
  TOKEN_CSS_VAR,
  type ThemeMode,
  type ThemePalette,
  type ThemeTokens,
} from "./types";

// Tailwind green/amber 600 (light) and 400 (dark): the tones used before
// themes carried their own.
const DEFAULT_TONES: Record<ThemeMode, { success: string; warning: string }> = {
  light: {
    success: "oklch(0.627 0.194 149.214)",
    warning: "oklch(0.666 0.179 58.318)",
  },
  dark: {
    success: "oklch(0.792 0.209 151.711)",
    warning: "oklch(0.828 0.189 84.429)",
  },
};

/** Palette for a theme without one (custom themes, some preset modes). */
export function derivePalette(
  tokens: ThemeTokens,
  mode: ThemeMode,
): ThemePalette {
  const dark = mode === "dark";
  const number = dark ? "oklch(0.76 0.13 40)" : "oklch(0.55 0.16 40)";
  return {
    ...DEFAULT_TONES[mode],
    syntax: {
      comment: tokens.sub,
      keyword: tokens.main,
      string: dark ? "oklch(0.82 0.12 85)" : "oklch(0.52 0.12 75)",
      number,
      function: dark ? "oklch(0.78 0.11 240)" : "oklch(0.5 0.15 255)",
      type: dark ? "oklch(0.8 0.1 190)" : "oklch(0.5 0.1 190)",
      operator: tokens.text,
      constant: number,
    },
  };
}

export type ResolvedTheme = { tokens: ThemeTokens; palette: ThemePalette };

export function resolveTheme(
  stored: StoredTheme,
  mode: ThemeMode,
): ResolvedTheme {
  if (stored.mode === "custom") {
    const tokens = stored.custom[mode];
    return { tokens, palette: derivePalette(tokens, mode) };
  }
  const preset = getPresetById(stored.presetId);
  const tokens = preset[mode];
  return {
    tokens,
    palette: preset.palette?.[mode] ?? derivePalette(tokens, mode),
  };
}

/** Every CSS custom property a theme sets on `<html>`. */
export function themeCssVars({
  tokens,
  palette,
}: ResolvedTheme): Record<string, string> {
  const vars: Record<string, string> = {
    "--success": palette.success,
    "--warning": palette.warning,
  };
  for (const key of Object.keys(TOKEN_CSS_VAR) as (keyof ThemeTokens)[]) {
    vars[TOKEN_CSS_VAR[key]] = tokens[key];
  }
  return vars;
}
