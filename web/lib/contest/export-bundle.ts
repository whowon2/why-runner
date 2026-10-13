import type { Language } from "@/drizzle/schema";
import type { Cell } from "@/lib/contest/standings";

export const LANGUAGE_EXTENSION: Record<Language, string> = {
  c: "c",
  cpp: "cpp",
  java: "java",
  python: "py",
  portugol: "por",
  rust: "rs",
};

export const OUTPUT_MAX_CHARS = 2000;

// Spreadsheet apps evaluate cells starting with these as formulas; names and
// judge output are participant-controlled, so neutralise them.
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

function csvField(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) return '""';
  let s = String(value);
  if (typeof value === "string" && FORMULA_PREFIX.test(s)) s = `'${s}`;
  return `"${s.replaceAll('"', '""')}"`;
}

/** RFC 4180 CSV (every field quoted, embedded quotes doubled, CRLF rows). */
export function toCsv(
  rows: (string | number | boolean | null | undefined)[][],
): string {
  // BOM so Excel reads UTF-8 (accented names) correctly.
  return `﻿${rows.map((r) => r.map(csvField).join(",")).join("\r\n")}\r\n`;
}

export function safePathSegment(s: string) {
  return s.replace(/[^A-Za-z0-9._-]/g, "_") || "_";
}

export function codeFilePath(input: {
  username: string;
  letter: string;
  sequence: number;
  status: string;
  language: Language | null;
}) {
  const ext = input.language ? LANGUAGE_EXTENSION[input.language] : "txt";
  return `code/${safePathSegment(input.username)}/${input.letter}-${input.sequence}-${input.status}.${ext}`;
}

/** Standings cell for CSV: "2 (34')" solved, "3" attempted, "" untouched. */
export function standingsCellText(cell: Cell | undefined) {
  if (!cell) return "";
  switch (cell.state) {
    case "solved":
      return `${cell.attempts} (${cell.minute}')${cell.firstSolve ? " *" : ""}`;
    case "attempted":
      return String(cell.attempts);
    case "pending":
      return `${cell.attempts} (pending)`;
    case "untouched":
      return "";
  }
}

export function truncate(s: string | null, max = OUTPUT_MAX_CHARS) {
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max)}… [truncated]` : s;
}
