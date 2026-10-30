/**
 * Browser-side port of the judge's built-in output comparison
 * (`judge/src/compare.rs`), used only to mark played examples as matching in
 * the editor workspace. Advisory: the judge's grading is authoritative, so
 * keep both files in sync.
 *
 * Pure module: runs in `bun test`.
 */

import type { ProblemCompareMode } from "@/drizzle/schema";

const NUMBER = /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/;

/**
 * Whether `actual` (the program's stdout) matches `expected` under `mode`.
 * `null` for `checker`: only the author's program can decide.
 */
export function outputsMatch(
  mode: ProblemCompareMode,
  epsilon: number,
  actual: string,
  expected: string,
): boolean | null {
  switch (mode) {
    case "checker":
      return null;
    case "exact":
      return actual.trim() === expected.trim();
    case "tokens":
      return tokensEqual(tokens(actual), tokens(expected), (a, e) => a === e);
    case "float":
      return tokensEqual(tokens(actual), tokens(expected), (a, e) =>
        floatTokenMatches(a, e, epsilon),
      );
  }
}

function tokens(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

function tokensEqual(
  actual: string[],
  expected: string[],
  eq: (a: string, e: string) => boolean,
): boolean {
  return (
    actual.length === expected.length && actual.every((a, i) => eq(a, expected[i]))
  );
}

// Numeric tokens match within an absolute-or-relative tolerance; any other
// pair (words, `nan`, `inf`) must be equal as strings.
function floatTokenMatches(actual: string, expected: string, epsilon: number) {
  if (actual === expected) return true;
  const a = parseFinite(actual);
  const e = parseFinite(expected);
  if (a === null || e === null) return false;
  const diff = Math.abs(a - e);
  return diff <= epsilon || diff <= epsilon * Math.abs(e);
}

function parseFinite(token: string): number | null {
  if (!NUMBER.test(token)) return null;
  const value = Number(token);
  return Number.isFinite(value) ? value : null;
}
