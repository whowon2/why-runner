import { type ResolvedTheme, themeCssVars } from "./palette";

export function applyTheme(theme: ResolvedTheme) {
  const root = document.documentElement;
  for (const [name, value] of Object.entries(themeCssVars(theme))) {
    root.style.setProperty(name, value);
  }
}
