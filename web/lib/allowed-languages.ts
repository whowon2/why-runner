import { z } from "zod";
import { Language } from "@/drizzle/schemas/language";

/**
 * A lesson exercise's / contest problem's allowed-languages list. Empty
 * means every language is allowed. Shared by the submit/run actions (which
 * enforce it) and the editor (which only offers these languages).
 */
export function isLanguageAllowed(
  allowed: readonly Language[],
  language: Language,
): boolean {
  return allowed.length === 0 || allowed.includes(language);
}

/** The languages the editor offers, in the enum's order. */
export function offeredLanguages(allowed: readonly Language[]): Language[] {
  return Language.enumValues.filter((l) => isLanguageAllowed(allowed, l));
}

/** Input for the setters: de-duplicated and stored in the enum's order. */
export const allowedLanguagesSchema = z
  .array(z.enum(Language.enumValues))
  .max(Language.enumValues.length * 2)
  .transform((list) => Language.enumValues.filter((l) => list.includes(l)));
