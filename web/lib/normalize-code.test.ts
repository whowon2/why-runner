import { describe, expect, test } from "bun:test";
import { normalizeCode } from "./normalize-code";

describe("normalizeCode", () => {
  test("no-break spaces become spaces", () => {
    expect(normalizeCode("if a:\n\u00a0\u00a0\u00a0\u00a0print(a)", "python")).toBe(
      "if a:\n    print(a)",
    );
    expect(normalizeCode("x\u202f=\u20071", "c")).toBe("x = 1");
  });

  test("zero-width characters and BOM are removed", () => {
    expect(normalizeCode("\ufeffa = 1\u200b\nb\u200c\u200d\u2060 = 2", "python")).toBe(
      "a = 1\nb = 2",
    );
  });

  test("line endings become LF", () => {
    expect(normalizeCode("a\r\nb\rc\u2028d\u2029e", "c")).toBe("a\nb\nc\nd\ne");
  });

  test("python leading tabs become four spaces", () => {
    expect(
      normalizeCode("if a:\n\tif b:\n\t\tprint(1)\n    print(2)", "python"),
    ).toBe("if a:\n    if b:\n        print(1)\n    print(2)");
    expect(normalizeCode("if a:\n  \tx = 1", "python")).toBe(
      "if a:\n      x = 1",
    );
  });

  test("python tabs after code are kept", () => {
    expect(normalizeCode('print("a\tb")\t# c', "python")).toBe(
      'print("a\tb")\t# c',
    );
  });

  test("other languages keep leading tabs", () => {
    expect(normalizeCode("int main() {\n\treturn 0;\n}", "c")).toBe(
      "int main() {\n\treturn 0;\n}",
    );
  });

  test("typographic quotes are kept", () => {
    expect(normalizeCode('print("“oi”")', "python")).toBe('print("“oi”")');
  });

  test("clean code is unchanged", () => {
    const code = "n = int(input())\nprint(n * (n + 1) // 2)\n";
    expect(normalizeCode(code, "python")).toBe(code);
  });
});
