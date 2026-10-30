/**
 * Cleans characters that pasting from Word, Google Docs, web pages or chat
 * apps (or Option+Space on a Mac) slips into code. They look like normal
 * spaces/newlines, or like nothing, but Python rejects them
 * (`invalid non-printable character U+00A0`) and a pasted tab block breaks
 * space-indented Python (`TabError`). Applied by the submit actions, so
 * what the judge runs is what the student sees.
 *
 * Typographic quotes are left alone: they can be legitimate inside strings.
 *
 * Pure module: runs in `bun test`.
 */

import type { Language } from "@/drizzle/schema";

// No-break space, figure space, narrow no-break space.
const SPACE_LIKE = /[\u00A0\u2007\u202F]/g;
// Zero-width space/non-joiner/joiner, word joiner, BOM.
const INVISIBLE = /\u200B|\u200C|\u200D|\u2060|\uFEFF/g;
// CRLF, lone CR, line separator, paragraph separator.
const LINE_BREAK = /\r\n|[\r\u2028\u2029]/g;

export function normalizeCode(code: string, language: Language): string {
  const cleaned = code
    .replace(SPACE_LIKE, " ")
    .replace(INVISIBLE, "")
    .replace(LINE_BREAK, "\n");
  if (language !== "python") return cleaned;
  // The editor indents with 4 spaces; a pasted tab-indented block would mix
  // tabs and spaces. Only leading tabs change, so tabs in strings stay.
  return cleaned.replace(/^[ \t]+/gm, (indent) =>
    indent.replace(/\t/g, "    "),
  );
}
