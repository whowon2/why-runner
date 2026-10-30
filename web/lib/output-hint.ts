/**
 * Spots a wrong answer whose output holds the expected lines plus extra
 * text, typically `input("Digite…")` prompts: Python prints the prompt to
 * stdout without a newline, so the real answer follows the last prompt on
 * the same line. Found in 31 failures of one classroom problem (survey
 * review, F8).
 *
 * Pure module: runs in `bun test`.
 */

function normalizedLines(text: string): string[] {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line) => line !== "");
}

/**
 * True when every non-blank expected line appears, in order, inside the
 * actual output and what's left over contains a letter. Extra numbers alone
 * don't count: that's a plain wrong answer, not a prompt.
 */
export function detectExtraOutput(actual: string, expected: string): boolean {
  const expectedLines = normalizedLines(expected);
  if (expectedLines.length === 0) return false;

  const text = normalizedLines(actual).join("\n");
  if (text === expectedLines.join("\n")) return false;

  let cursor = 0;
  let leftover = "";
  for (const line of expectedLines) {
    const at = text.indexOf(line, cursor);
    if (at === -1) return false;
    leftover += text.slice(cursor, at);
    cursor = at + line.length;
  }
  leftover += text.slice(cursor);

  return /\p{L}/u.test(leftover);
}
