import { describe, expect, test } from "bun:test";
import { comparePair, type PreparedDoc } from "./compare";
import { fingerprint, kgramHashes, winnow } from "./fingerprint";
import { pickPerStudent } from "./pick";
import { buildSimilarityReport } from "./report";
import { tokenize } from "./tokenize";
import type { Language } from "@/drizzle/schemas/submissions";

const types = (code: string, lang: Language | null = "c") =>
  tokenize(code, lang).map((t) => t.t);

const prep = (code: string, lang: Language | null = "c"): PreparedDoc => {
  const tokens = tokenize(code, lang);
  return { tokens, fingerprints: fingerprint(tokens) };
};

const cSum = `#include <stdio.h>
int main() {
    int n, total = 0;
    scanf("%d", &n);
    for (int i = 0; i < n; i++) {
        int x;
        scanf("%d", &x);
        total += x;
    }
    printf("%d\\n", total);
    return 0;
}
`;

// cSum with renamed variables, comments and different layout.
const cSumDisguised = `#include <stdio.h>
#include <stdlib.h>

/* soma os valores */
int main()
{
  int quantidade, soma = 0; // acumulador
  scanf("%i", &quantidade);
  for (int k = 0; k < quantidade; k++)
  {
    int valor;
    scanf("%i", &valor);
    soma += valor;
  }
  printf("total: %i\\n", soma);
  return 0;
}
`;

const cOther = `#include <stdio.h>
int main() {
    long long a, b;
    while (scanf("%lld %lld", &a, &b) == 2) {
        if (a > b) { long long t = a; a = b; b = t; }
        printf("%lld\\n", b - a);
    }
    return 0;
}
`;

describe("tokenize", () => {
  test("normalizes identifiers, numbers and strings, keeps keywords/operators", () => {
    expect(types('int x = 42; char *s = "hi";')).toEqual([
      "int",
      "V",
      "=",
      "N",
      ";",
      "char",
      "*",
      "V",
      "=",
      "S",
      ";",
    ]);
  });

  test("drops comments, whitespace and preprocessor lines", () => {
    expect(types(cSum)).toEqual(types(cSumDisguised));
  });

  test("keeps character offsets into the source", () => {
    const code = "  foo += 10;";
    const [first, op, num] = tokenize(code, "c");
    expect(code.slice(first.start, first.end)).toBe("foo");
    expect(code.slice(op.start, op.end)).toBe("+=");
    expect(code.slice(num.start, num.end)).toBe("10");
  });

  test("python: # comments, triple-quoted and prefixed strings", () => {
    const a = `def f(n):\n    """doc"""\n    return n * 2  # dobra\nprint(f"{f(3)}")\n`;
    const b = `def g(x):\n    return x * 2\nprint("x")\n`;
    expect(types(a, "python").filter((t) => t !== "S")).toEqual(
      types(b, "python").filter((t) => t !== "S"),
    );
    expect(types("x = 1 // 2", "python")).toEqual(["V", "=", "N", "//", "N"]);
  });

  test("java: skips package/import header", () => {
    const a = `package a.b;\nimport java.util.*;\nclass Main { }`;
    expect(types(a, "java")).toEqual(["class", "V", "{", "}"]);
  });

  test("rust: lifetimes, chars, raw strings, nested comments, ranges", () => {
    expect(
      types(
        `fn f<'a>(s: &'a str) -> char { /* a /* b */ c */ let r = r#"x"#; for i in 0..10 {} 'z' }`,
        "rust",
      ),
    ).toEqual([
      "fn",
      "V",
      "<",
      "'",
      "V",
      ">",
      "(",
      "V",
      ":",
      "&",
      "'",
      "V",
      "V",
      ")",
      "->",
      "V",
      "{",
      "let",
      "V",
      "=",
      "S",
      ";",
      "for",
      "V",
      "in",
      "N",
      "..",
      "N",
      "{",
      "}",
      "S",
      "}",
    ]);
  });

  test("portugol keywords survive normalization", () => {
    expect(types("se (x > 0) { escreva(x) }", "portugol")).toEqual([
      "se",
      "(",
      "V",
      ">",
      "N",
      ")",
      "{",
      "escreva",
      "(",
      "V",
      ")",
      "}",
    ]);
  });

  test("no language falls back to C rules", () => {
    expect(types("int a; // x", null)).toEqual(["int", "V", ";"]);
  });
});

describe("fingerprint", () => {
  test("fewer than k tokens has no fingerprints", () => {
    expect(fingerprint(tokenize("a = b", "c"))).toEqual([]);
  });

  test("winnow keeps the rightmost minimum of each window once", () => {
    expect(winnow([5, 3, 3, 8, 9, 1, 7], 3)).toEqual([
      { hash: 3, pos: 2 },
      { hash: 1, pos: 5 },
    ]);
  });

  test("short input still selects one fingerprint", () => {
    expect(winnow([4, 2], 4)).toEqual([{ hash: 2, pos: 1 }]);
  });

  test("a shared run of w + k - 1 tokens always shares a fingerprint", () => {
    const shared = "x = y + z * 3 ;"; // 8 tokens
    const a = prep(`while (p) { p--; } ${shared} return;`);
    const b = prep(`if (q > 1) q = 0; ${shared} break;`);
    const hashesB = new Set(b.fingerprints.map((f) => f.hash));
    expect(a.fingerprints.some((f) => hashesB.has(f.hash))).toBe(true);
    expect(comparePair(a, b).regions.length).toBeGreaterThan(0);
  });

  test("k-gram hashes depend on token boundaries", () => {
    const [h1] = kgramHashes(
      [
        { t: "a", start: 0, end: 1 },
        { t: "bc", start: 0, end: 1 },
      ],
      2,
    );
    const [h2] = kgramHashes(
      [
        { t: "ab", start: 0, end: 1 },
        { t: "c", start: 0, end: 1 },
      ],
      2,
    );
    expect(h1).not.toBe(h2);
  });
});

describe("comparePair", () => {
  test("identical programs are 100% with one full region", () => {
    const r = comparePair(prep(cSum), prep(cSum));
    expect(r.similarity).toBe(1);
    expect(r.coverageA).toBe(1);
    expect(r.coverageB).toBe(1);
    expect(r.regions).toHaveLength(1);
  });

  test("renamed + reformatted copy is 100%, regions map to source", () => {
    const r = comparePair(prep(cSum), prep(cSumDisguised));
    expect(r.similarity).toBe(1);
    const [region] = r.regions;
    expect(cSum.slice(...region.a).startsWith("int main()")).toBe(true);
    expect(cSumDisguised.slice(...region.b).endsWith("}")).toBe(true);
  });

  test("unrelated programs score low", () => {
    expect(comparePair(prep(cSum), prep(cOther)).similarity).toBeLessThan(0.4);
  });

  test("partial copy: full coverage on the copied side only", () => {
    const extra = `void outra(double *v, int len) { double m = v[0]; while (len-- > 1) { if (v[len] > m) m = v[len]; } printf("%f", m); switch (len) { case 1: break; default: m = -m; } }\n`;
    const r = comparePair(prep(cSum), prep(cSum + extra));
    expect(r.coverageA).toBe(1);
    expect(r.coverageB).toBeGreaterThan(0.4);
    expect(r.coverageB).toBeLessThan(0.7);
    expect(r.similarity).toBeGreaterThan(r.coverageB);
    expect(r.similarity).toBeLessThan(1);
  });

  test("symmetric", () => {
    const a = prep(cSum);
    const b = prep(
      cSumDisguised.replace("soma += valor;", "soma = soma + valor * 2;"),
    );
    const ab = comparePair(a, b);
    const ba = comparePair(b, a);
    expect(ab.similarity).toBe(ba.similarity);
    expect(ab.regions.map((r) => r.a).sort()).toEqual(
      ba.regions.map((r) => r.b).sort(),
    );
  });

  test("tiny programs score 0", () => {
    const r = comparePair(prep("x;"), prep("x;"));
    expect(r.similarity).toBe(0);
    expect(r.regions).toEqual([]);
  });

  test("ignored hashes never seed a match", () => {
    const a = prep(cSum);
    const ignore = new Set(a.fingerprints.map((f) => f.hash));
    expect(comparePair(a, prep(cSum), { ignore }).similarity).toBe(0);
  });
});

describe("buildSimilarityReport", () => {
  const entry = (
    id: string,
    code: string,
    language: Language | null = "c",
  ) => ({
    id,
    studentId: `u-${id}`,
    language,
    code,
  });

  test("pairs only different students in the same language, sorted", () => {
    const { pairs, truncated } = buildSimilarityReport(
      [
        entry("a", cSum),
        entry("b", cSumDisguised),
        entry("c", cOther),
        entry(
          "p",
          "n = int(input())\nprint(sum(int(input()) for _ in range(n)))\n",
          "python",
        ),
        { ...entry("a2", cSum), studentId: "u-a" },
      ],
      { commonMinEntries: 99 },
    );
    expect(truncated).toBe(false);
    expect(pairs[0].similarity).toBe(1);
    expect(pairs.some((p) => p.a === "p" || p.b === "p")).toBe(false);
    expect(pairs.some((p) => p.a === "a" && p.b === "a2")).toBe(false);
    for (let i = 1; i < pairs.length; i++) {
      expect(pairs[i - 1].similarity).toBeGreaterThanOrEqual(
        pairs[i].similarity,
      );
    }
  });

  test("boilerplate shared by most of the class is ignored", () => {
    const skeleton = (body: string) =>
      `#include <stdio.h>\nint main() {\n  int n;\n  scanf("%d", &n);\n${body}\n  return 0;\n}\n`;
    const bodies = [
      `  printf("%d\\n", n * n);`,
      `  while (n > 9) n = n / 10; printf("%d", n);`,
      `  for (int i = 1; i <= n; i++) if (n % i == 0) printf("%d ", i);`,
      `  long r = 1; do { r *= 2; } while (--n);`,
      `  char c = n > 0 ? 'p' : 'n'; putchar(c);`,
    ];
    const withFilter = buildSimilarityReport(
      bodies.map((b, i) => entry(String(i), skeleton(b))),
    );
    const withoutFilter = buildSimilarityReport(
      bodies.map((b, i) => entry(String(i), skeleton(b))),
      { commonMinEntries: 99 },
    );
    const max = (r: typeof withFilter) =>
      Math.max(0, ...r.pairs.map((p) => p.similarity));
    expect(max(withFilter)).toBeLessThan(0.3);
    expect(max(withoutFilter)).toBeGreaterThan(max(withFilter));
  });

  test("caps pairs and flags truncation", () => {
    const r = buildSimilarityReport(
      ["a", "b", "c", "d"].map((id) => entry(id, cSum)),
      { maxPairs: 2, commonMinEntries: 99 },
    );
    expect(r.pairs).toHaveLength(2);
    expect(r.truncated).toBe(true);
  });
});

describe("pickPerStudent", () => {
  const at = (minutes: number) => new Date(Date.UTC(2026, 0, 1, 0, minutes));
  const report = (passed: number) =>
    JSON.stringify({ total_tests: 4, passed_count: passed });
  const subs = [
    {
      id: "1",
      userId: "x",
      status: "PASSED",
      createdAt: at(1),
      output: report(4),
    },
    {
      id: "2",
      userId: "x",
      status: "FAILED",
      createdAt: at(2),
      output: report(1),
    },
    { id: "3", userId: "x", status: "PENDING", createdAt: at(3), output: null },
    {
      id: "4",
      userId: "y",
      status: "FAILED",
      createdAt: at(0),
      output: report(3),
    },
    {
      id: "5",
      userId: "y",
      status: "FAILED",
      createdAt: at(4),
      output: report(2),
    },
    { id: "6", userId: "y", status: "ERROR", createdAt: at(5), output: null },
  ];

  test("latest skips unjudged submissions", () => {
    expect(pickPerStudent(subs, "latest").map((s) => s.id)).toEqual(["6", "2"]);
  });

  test("best prefers PASSED, then highest passed fraction", () => {
    expect(pickPerStudent(subs, "best").map((s) => s.id)).toEqual(["1", "4"]);
  });
});
