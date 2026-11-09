import { getPresetById } from "./presets";
import {
  type CustomTheme,
  type StoredTheme,
  TOKEN_KEYS,
  type ThemeMode,
  type ThemeTokens,
} from "./types";
import { isValidHexColor } from "./validate";

/** Any CSS color as `#rrggbb`, or null if it can't be converted. */
export type HexConverter = (color: string) => string | null;

/**
 * The tokens with every non-hex color (presets use oklch) converted to hex,
 * since custom themes are stored and saved to the account as hex only.
 * Null if a color can't be converted.
 */
export function toHexTokens(
  tokens: ThemeTokens,
  toHex: HexConverter,
): ThemeTokens | null {
  const out = {} as ThemeTokens;
  for (const key of TOKEN_KEYS) {
    const value = tokens[key];
    const hex = isValidHexColor(value) ? value : toHex(value);
    if (!hex || !isValidHexColor(hex)) return null;
    out[key] = hex;
  }
  return out;
}

/** Both modes of `stored` as tokens: a custom theme's own, or its preset's. */
function customBase(stored: StoredTheme): CustomTheme {
  if (stored.mode === "custom") return stored.custom;
  const preset = getPresetById(stored.presetId);
  return { light: preset.light, dark: preset.dark };
}

/**
 * `stored` with `mode`'s tokens replaced by `tokens` (already hex). The other
 * mode keeps its colors (from the preset when switching to custom), converted
 * to hex; if that fails it falls back to `tokens`.
 */
export function withCustomTokens(
  stored: StoredTheme,
  mode: ThemeMode,
  tokens: ThemeTokens,
  toHex: HexConverter,
): StoredTheme {
  const base = customBase(stored);
  const other: ThemeMode = mode === "light" ? "dark" : "light";
  return {
    mode: "custom",
    custom: {
      [mode]: tokens,
      [other]: toHexTokens(base[other], toHex) ?? tokens,
    } as CustomTheme,
  };
}

/** Starting values for the custom theme editor in `mode`, as hex. */
export function editableTokens(
  stored: StoredTheme,
  mode: ThemeMode,
  toHex: HexConverter,
): ThemeTokens | null {
  return toHexTokens(customBase(stored)[mode], toHex);
}
