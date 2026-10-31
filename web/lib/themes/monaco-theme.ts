import type { editor } from "monaco-editor";
import { mix, type Rgba, toHex, toRgba } from "./color";
import type { ResolvedTheme } from "./palette";
import type { ThemeMode } from "./types";

/** The one Monaco theme name; redefined whenever the app theme changes. */
export const MONACO_THEME = "why-runner";

/**
 * Monaco theme from the app theme: the editor sits on the panel background
 * with the theme's text, caret and accent, and highlights with the palette's
 * syntax colors. Browser-only (colors go through a canvas).
 */
export function buildMonacoTheme(
  { tokens, palette }: ResolvedTheme,
  mode: ThemeMode,
): editor.IStandaloneThemeData {
  const fallback: Rgba = mode === "dark" ? [0, 0, 0, 1] : [255, 255, 255, 1];
  const rgb = (color: string) => toRgba(color) ?? fallback;
  const bg = rgb(tokens.background);
  const fg = rgb(tokens.text);
  const main = rgb(tokens.main);
  const warning = rgb(palette.warning);
  // Foreground blended into the background, for chrome lines and widgets.
  const tint = (amount: number) => toHex(mix(fg, bg, amount));
  const alpha = (color: Rgba, a: number) => toHex(color, a);
  // Token rules take hex without `#`.
  const rule = (token: string, color: string, fontStyle?: string) => ({
    token,
    foreground: toHex(rgb(color)).slice(1),
    ...(fontStyle && { fontStyle }),
  });
  const s = palette.syntax;

  return {
    base: mode === "dark" ? "vs-dark" : "vs",
    inherit: true,
    rules: [
      rule("", tokens.text),
      rule("comment", s.comment, "italic"),
      rule("keyword", s.keyword),
      rule("storage", s.keyword),
      rule("string", s.string),
      rule("string.escape", s.constant),
      rule("regexp", s.string),
      rule("number", s.number),
      rule("constant", s.constant),
      rule("type", s.type),
      rule("type.identifier", s.type),
      rule("annotation", s.type),
      rule("predefined", s.function),
      rule("function", s.function),
      rule("identifier", tokens.text),
      rule("variable", tokens.text),
      rule("delimiter", tokens.text),
      rule("operator", s.operator),
      rule("tag", s.keyword),
      rule("attribute.name", s.function),
      rule("attribute.value", s.string),
    ],
    colors: {
      "editor.background": toHex(bg),
      "editor.foreground": toHex(fg),
      "editorGutter.background": toHex(bg),
      "editorLineNumber.foreground": tint(0.35),
      "editorLineNumber.activeForeground": toHex(fg),
      "editorCursor.foreground": toHex(rgb(tokens.caret)),
      "editor.lineHighlightBackground": tint(0.05),
      "editor.lineHighlightBorder": tint(0.05),
      "editor.selectionBackground": alpha(main, 0.3),
      "editor.inactiveSelectionBackground": alpha(main, 0.18),
      "editor.selectionHighlightBackground": alpha(main, 0.14),
      "editor.wordHighlightBackground": alpha(main, 0.14),
      "editor.findMatchBackground": alpha(warning, 0.4),
      "editor.findMatchHighlightBackground": alpha(warning, 0.2),
      "editorBracketMatch.background": alpha(main, 0.15),
      "editorBracketMatch.border": alpha(main, 0.6),
      "editorBracketHighlight.foreground1": toHex(rgb(s.keyword)),
      "editorBracketHighlight.foreground2": toHex(rgb(s.function)),
      "editorBracketHighlight.foreground3": toHex(rgb(s.type)),
      "editorIndentGuide.background1": tint(0.1),
      "editorIndentGuide.activeBackground1": tint(0.25),
      "editorWhitespace.foreground": tint(0.2),
      "editorError.foreground": toHex(rgb(tokens.error)),
      "editorWarning.foreground": toHex(warning),
      "editorOverviewRuler.border": "#00000000",
      "editorWidget.background": tint(0.04),
      "editorWidget.border": tint(0.15),
      "editorHoverWidget.background": tint(0.04),
      "editorHoverWidget.border": tint(0.15),
      "editorSuggestWidget.background": tint(0.04),
      "editorSuggestWidget.border": tint(0.15),
      "editorSuggestWidget.foreground": toHex(fg),
      "editorSuggestWidget.selectedBackground": alpha(main, 0.2),
      "editorSuggestWidget.highlightForeground": toHex(main),
      "input.background": tint(0.06),
      "input.border": tint(0.15),
      "input.foreground": toHex(fg),
      focusBorder: alpha(main, 0.6),
      "scrollbarSlider.background": alpha(fg, 0.12),
      "scrollbarSlider.hoverBackground": alpha(fg, 0.2),
      "scrollbarSlider.activeBackground": alpha(fg, 0.28),
    },
  };
}
