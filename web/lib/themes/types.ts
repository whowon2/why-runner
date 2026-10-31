export const TOKEN_KEYS = [
  "background",
  "main",
  "text",
  "sub",
  "caret",
  "error",
] as const;

export type TokenKey = (typeof TOKEN_KEYS)[number];

export const TOKEN_CSS_VAR: Record<TokenKey, string> = {
  background: "--background",
  main: "--primary",
  text: "--foreground",
  sub: "--muted-foreground",
  caret: "--ring",
  error: "--destructive",
};

export type ThemeTokens = Record<TokenKey, string>;

export type ThemeMode = "light" | "dark";

/** Syntax colors for the code editor (Monaco token rules). */
export type SyntaxColors = {
  comment: string;
  keyword: string;
  string: string;
  number: string;
  function: string;
  type: string;
  operator: string;
  constant: string;
};

/**
 * Colors beyond the six UI tokens: verdict tones (`--success`/`--warning`)
 * and the editor's syntax highlighting. Presets carry their theme's official
 * palette; custom themes and palette-less modes get `derivePalette`.
 */
export type ThemePalette = {
  success: string;
  warning: string;
  syntax: SyntaxColors;
};

export type ThemePreset = {
  id: string;
  name: string;
  light: ThemeTokens;
  dark: ThemeTokens;
  palette?: Partial<Record<ThemeMode, ThemePalette>>;
};

export type CustomTheme = Record<ThemeMode, ThemeTokens>;

export type StoredTheme =
  | { mode: "preset"; presetId: string }
  | { mode: "custom"; custom: CustomTheme };
