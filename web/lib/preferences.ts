import { z } from "zod";
import { PRESETS } from "./themes/presets";
import { TOKEN_KEYS, type TokenKey } from "./themes/types";
import { isValidHexColor } from "./themes/validate";

// Relative imports: drizzle-kit loads this through the schema, without the
// `@/` alias.

export const COLOR_MODES = ["light", "dark", "system"] as const;
export type ColorMode = (typeof COLOR_MODES)[number];
export const LINE_NUMBERS = ["on", "off", "relative"] as const;
export type LineNumbers = (typeof LINE_NUMBERS)[number];
export const TAB_SIZES = [2, 4, 8] as const;
export type TabSize = (typeof TAB_SIZES)[number];

export const EDITOR_FONT_SIZE_MIN = 10;
export const EDITOR_FONT_SIZE_MAX = 32;
export const EDITOR_FONT_SIZE_DEFAULT = 14;

// Defaults match the editor before these settings existed (Monaco's own).
export const EDITOR_DEFAULTS = {
  fontSize: EDITOR_FONT_SIZE_DEFAULT,
  autoClose: true,
  vim: false,
  tabSize: 4 as TabSize,
  wordWrap: false,
  lineNumbers: "on" as LineNumbers,
  minimap: true,
};

const hexColor = z.string().refine(isValidHexColor);
const tokens = z
  .object(
    Object.fromEntries(TOKEN_KEYS.map((key) => [key, hexColor])) as Record<
      TokenKey,
      typeof hexColor
    >,
  )
  .strict();

export const storedThemeSchema = z.discriminatedUnion("mode", [
  z
    .object({
      mode: z.literal("preset"),
      presetId: z
        .string()
        .refine((id) => PRESETS.some((preset) => preset.id === id)),
    })
    .strict(),
  z
    .object({
      mode: z.literal("custom"),
      custom: z.object({ light: tokens, dark: tokens }).strict(),
    })
    .strict(),
]);

/** Fields of `user_preference` a client may write; null resets to default. */
export const preferencesPatchSchema = z
  .object({
    colorMode: z.enum(COLOR_MODES).nullable(),
    theme: storedThemeSchema.nullable(),
    editorFontSize: z
      .number()
      .int()
      .min(EDITOR_FONT_SIZE_MIN)
      .max(EDITOR_FONT_SIZE_MAX)
      .nullable(),
    editorAutoClose: z.boolean().nullable(),
    editorVim: z.boolean().nullable(),
    editorTabSize: z.union(TAB_SIZES.map((size) => z.literal(size))).nullable(),
    editorWordWrap: z.boolean().nullable(),
    editorLineNumbers: z.enum(LINE_NUMBERS).nullable(),
    editorMinimap: z.boolean().nullable(),
  })
  .partial()
  .strict();

export type PreferencesPatch = z.infer<typeof preferencesPatchSchema>;
export type PreferenceKey = keyof PreferencesPatch;
