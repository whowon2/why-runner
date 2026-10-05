import { describe, expect, test } from "bun:test";
import {
  assembleParsons,
  isValidParsonsAnswer,
  parsonsLines,
  shuffle,
} from "./parsons";

const solution = `n = int(input())
for i in range(n):
    print(i)

print("fim")
`;

describe("parsons", () => {
  test("splits non-blank lines and strips indentation", () => {
    expect(parsonsLines(solution)).toEqual([
      "n = int(input())",
      "for i in range(n):",
      "print(i)",
      'print("fim")',
    ]);
  });

  test("shuffle keeps every line exactly once", () => {
    const lines = parsonsLines(solution);
    expect(shuffle(lines).sort()).toEqual([...lines].sort());
  });

  test("accepts the original order and an alternative order", () => {
    const original = [
      { text: "n = int(input())", indent: 0 },
      { text: "for i in range(n):", indent: 0 },
      { text: "print(i)", indent: 1 },
      { text: 'print("fim")', indent: 0 },
    ];
    expect(isValidParsonsAnswer(solution, original)).toBe(true);
    expect(isValidParsonsAnswer(solution, [...original].reverse())).toBe(true);
  });

  test("rejects a missing, extra, repeated or edited line", () => {
    const base = parsonsLines(solution).map((text) => ({ text, indent: 0 }));
    expect(isValidParsonsAnswer(solution, base.slice(1))).toBe(false);
    expect(
      isValidParsonsAnswer(solution, [...base, { text: "x = 1", indent: 0 }]),
    ).toBe(false);
    expect(
      isValidParsonsAnswer(solution, [base[0], base[0], base[2], base[3]]),
    ).toBe(false);
    expect(
      isValidParsonsAnswer(solution, [
        { text: "n = 5", indent: 0 },
        ...base.slice(1),
      ]),
    ).toBe(false);
  });

  test("identical lines are interchangeable", () => {
    const braces = "se (x) {\n}\nenquanto (y) {\n}";
    const answer = ["}", "se (x) {", "}", "enquanto (y) {"].map((text) => ({
      text,
      indent: 0,
    }));
    expect(isValidParsonsAnswer(braces, answer)).toBe(true);
  });

  test("rejects out-of-range indentation", () => {
    const base = parsonsLines(solution).map((text) => ({ text, indent: 0 }));
    expect(
      isValidParsonsAnswer(solution, [
        { ...base[0], indent: -1 },
        ...base.slice(1),
      ]),
    ).toBe(false);
    expect(
      isValidParsonsAnswer(solution, [
        { ...base[0], indent: 99 },
        ...base.slice(1),
      ]),
    ).toBe(false);
    expect(
      isValidParsonsAnswer(solution, [
        { ...base[0], indent: 1.5 },
        ...base.slice(1),
      ]),
    ).toBe(false);
  });

  test("assembles with four spaces per indent level", () => {
    expect(
      assembleParsons([
        { text: "for i in range(3):", indent: 0 },
        { text: "print(i)", indent: 1 },
      ]),
    ).toBe("for i in range(3):\n    print(i)\n");
  });
});
