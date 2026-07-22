import { TOKEN_CSS_VAR, type ThemeTokens } from "./types";

export function applyThemeTokens(tokens: ThemeTokens) {
  const root = document.documentElement;
  for (const key of Object.keys(TOKEN_CSS_VAR) as (keyof typeof TOKEN_CSS_VAR)[]) {
    root.style.setProperty(TOKEN_CSS_VAR[key], tokens[key]);
  }
}
