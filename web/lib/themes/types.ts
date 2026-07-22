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

export type ThemePreset = {
  id: string;
  name: string;
  light: ThemeTokens;
  dark: ThemeTokens;
};

export type CustomTheme = Record<ThemeMode, ThemeTokens>;

export type StoredTheme =
  | { mode: "preset"; presetId: string }
  | { mode: "custom"; custom: CustomTheme };
