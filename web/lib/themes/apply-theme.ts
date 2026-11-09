import { type ResolvedTheme, themeCssVars } from "./palette";

export function applyTheme(theme: ResolvedTheme) {
  const style = document.documentElement.style;
  for (const [name, value] of Object.entries(themeCssVars(theme))) {
    // Unchanged values skip the write, so re-applying the theme a live
    // preview already painted doesn't invalidate the whole page's style.
    if (style.getPropertyValue(name) !== value) style.setProperty(name, value);
  }
}
