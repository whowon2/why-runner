import { describe, expect, test } from "bun:test";
import { codeFilePath, standingsCellText, toCsv } from "./export-bundle";

// Minimal RFC 4180 parser to check round-tripping.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const s = text.replace(/^﻿/, "");
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (quoted) {
      if (c === '"' && s[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\r" && s[i + 1] === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      i++;
    } else field += c;
  }
  return rows;
}

describe("toCsv", () => {
  test("comma, quote and newline stay in one field", () => {
    const name = 'Doe, "JJ"\nJr';
    const rows = parseCsv(
      toCsv([
        ["name", "n"],
        [name, 3],
      ]),
    );
    expect(rows).toEqual([
      ["name", "n"],
      [name, "3"],
    ]);
  });

  test("formula-looking strings are neutralised, numbers untouched", () => {
    const rows = parseCsv(toCsv([["=1+1", -5]]));
    expect(rows).toEqual([["'=1+1", "-5"]]);
  });
});

describe("codeFilePath", () => {
  test("uses language extension and sanitises username", () => {
    expect(
      codeFilePath({
        username: "a/../b",
        letter: "A",
        sequence: 2,
        status: "PASSED",
        language: "python",
      }),
    ).toBe("code/a_.._b/A-2-PASSED.py");
  });
});

describe("standingsCellText", () => {
  test("variants", () => {
    expect(
      standingsCellText({
        state: "solved",
        attempts: 2,
        minute: 34,
        firstSolve: false,
      }),
    ).toBe("2 (34')");
    expect(standingsCellText({ state: "attempted", attempts: 3 })).toBe("3");
    expect(standingsCellText({ state: "untouched" })).toBe("");
  });
});
