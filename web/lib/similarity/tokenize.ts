import type { Language } from "@/drizzle/schemas/submissions";
import { LEXERS, type LexerConfig, OPERATORS } from "./languages";

/**
 * One normalized token. `t` is what gets compared: identifiers become `V`,
 * numbers `N`, string/char literals `S`; keywords and operators stay as
 * written. `start`/`end` are character offsets into the original source, so
 * matched token runs can be highlighted in the code the student wrote.
 */
export type Token = { t: string; start: number; end: number };

const IDENT_START = /[\p{L}_$]/u;
const IDENT_PART = /[\p{L}\p{N}_$]/u;
const DIGIT = /[0-9]/;
const NUMBER_PART = /[0-9A-Za-z_.]/;
const SPACE = /\s/;

/** Tokenizes `code` with the rules of `language` (C rules when it has none). */
export function tokenize(code: string, language: Language | null): Token[] {
  const cfg: LexerConfig = LEXERS[language ?? "c"] ?? LEXERS.c;
  const tokens: Token[] = [];
  const n = code.length;
  let i = 0;
  // Start of the current line's content (after indentation) — where
  // `skipLines` prefixes like `#include` are recognized.
  let atLineStart = true;

  const startsWith = (s: string, at = i) => code.startsWith(s, at);

  // Index just after the literal opened by `quote` at `from` (escapes honored).
  const skipQuoted = (from: number, quote: string): number => {
    let j = from + quote.length;
    while (j < n) {
      if (code[j] === "\\") {
        j += 2;
        continue;
      }
      if (startsWith(quote, j)) return j + quote.length;
      // Single-quoted literals never span lines; recover on unterminated ones.
      if (quote.length === 1 && code[j] === "\n") return j;
      j++;
    }
    return n;
  };

  while (i < n) {
    const ch = code[i];

    if (SPACE.test(ch)) {
      if (ch === "\n") atLineStart = true;
      i++;
      continue;
    }

    if (atLineStart && cfg.skipLines?.some((p) => startsWith(p))) {
      // Preprocessor lines, including `\`-continued ones.
      while (i < n && code[i] !== "\n") {
        if (code[i] === "\\" && code[i + 1] === "\n") i++;
        i++;
      }
      continue;
    }
    atLineStart = false;

    const line = cfg.lineComments.find((p) => startsWith(p));
    if (line) {
      while (i < n && code[i] !== "\n") i++;
      continue;
    }

    const block = cfg.blockComments.find((b) => startsWith(b.open));
    if (block) {
      let depth = 1;
      i += block.open.length;
      while (i < n && depth > 0) {
        if (block.nested && startsWith(block.open)) {
          depth++;
          i += block.open.length;
        } else if (startsWith(block.close)) {
          depth--;
          i += block.close.length;
        } else i++;
      }
      continue;
    }

    const start = i;

    if (cfg.rust && ch === "r" && /^r#*"/.test(code.slice(i, i + 258))) {
      const hashes = /^r(#*)"/.exec(code.slice(i, i + 258))?.[1] ?? "";
      const close = `"${hashes}`;
      const end = code.indexOf(close, i + 2 + hashes.length);
      i = end === -1 ? n : end + close.length;
      tokens.push({ t: "S", start, end: i });
      continue;
    }

    if (cfg.rust && ch === "'") {
      // `'x'` / `'\n'` is a char; anything else is a lifetime tick.
      const m = /^'(?:\\.[^']*|[^\\'\n])'/u.exec(code.slice(i, i + 16));
      if (m) {
        i += m[0].length;
        tokens.push({ t: "S", start, end: i });
      } else {
        i++;
        tokens.push({ t: "'", start, end: i });
      }
      continue;
    }

    if (cfg.quotes.includes(ch)) {
      const triple = cfg.tripleQuotes && startsWith(ch.repeat(3));
      i = skipQuoted(i, triple ? ch.repeat(3) : ch);
      tokens.push({ t: "S", start, end: i });
      continue;
    }

    if (DIGIT.test(ch) || (ch === "." && DIGIT.test(code[i + 1] ?? ""))) {
      i++;
      // Stop before `..` so Rust ranges `0..n` stay three tokens.
      while (i < n && NUMBER_PART.test(code[i]) && !startsWith("..")) i++;
      tokens.push({ t: "N", start, end: i });
      continue;
    }

    if (IDENT_START.test(ch)) {
      i++;
      while (i < n && IDENT_PART.test(code[i])) i++;
      const word = code.slice(start, i);

      if (
        cfg.stringPrefixes?.includes(word.toLowerCase()) &&
        cfg.quotes.includes(code[i] ?? "")
      ) {
        const q = code[i];
        const triple = cfg.tripleQuotes && startsWith(q.repeat(3));
        i = skipQuoted(i, triple ? q.repeat(3) : q);
        tokens.push({ t: "S", start, end: i });
        continue;
      }

      if (cfg.skipStatements?.includes(word) && tokens.length === 0) {
        // Only before the first real token (Java's header), so a field or
        // variable named `package`/`import` later on is never swallowed.
        while (i < n && code[i] !== ";") i++;
        i++;
        continue;
      }
      tokens.push({ t: cfg.keywords.has(word) ? word : "V", start, end: i });
      continue;
    }

    const op = OPERATORS.find((o) => startsWith(o)) ?? ch;
    i += op.length;
    tokens.push({ t: op, start, end: i });
  }

  return tokens;
}
