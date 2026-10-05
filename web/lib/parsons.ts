// Parsons problems: the professor's solution is split into lines, shown to
// the student shuffled, and the student's ordering is assembled back into a
// program on the server. Grading is by the judge on I/O, so any order that
// works passes — the original order is never compared against.

export const PARSONS_MAX_INDENT = 6;
const INDENT = "    ";

export interface ParsonsLine {
  text: string;
  indent: number;
}

/** Non-blank solution lines with leading indentation stripped. */
export function parsonsLines(solution: string): string[] {
  return solution
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Fisher–Yates shuffle (returns a new array). */
export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * True when `submitted` uses exactly the solution's lines, each one as many
 * times as it appears in the solution (identical lines like `}` are
 * interchangeable), with indent levels in range.
 */
export function isValidParsonsAnswer(
  solution: string,
  submitted: ParsonsLine[],
): boolean {
  const expected = parsonsLines(solution).sort();
  const got = submitted.map((l) => l.text.trim()).sort();
  if (expected.length !== got.length) return false;
  if (expected.some((line, i) => line !== got[i])) return false;
  return submitted.every(
    (l) =>
      Number.isInteger(l.indent) &&
      l.indent >= 0 &&
      l.indent <= PARSONS_MAX_INDENT,
  );
}

export function assembleParsons(lines: ParsonsLine[]): string {
  return `${lines.map((l) => INDENT.repeat(l.indent) + l.text.trim()).join("\n")}\n`;
}
