import { describe, expect, test } from "bun:test";
import { Language } from "@/drizzle/schemas/submissions";
import { getStarterCode, nextCodeOnLanguageChange } from "./starter-code";

const comments = { read: "READ_INPUT", write: "WRITE_OUTPUT" };

describe("getStarterCode", () => {
  test.each(Language.enumValues)(
    "%s has a template with both comments",
    (lang) => {
      const code = getStarterCode(lang, comments);
      expect(code).toContain("READ_INPUT");
      expect(code).toContain("WRITE_OUTPUT");
      expect(code.indexOf("READ_INPUT")).toBeLessThan(
        code.indexOf("WRITE_OUTPUT"),
      );
    },
  );

  test("java declares public class Main", () => {
    expect(getStarterCode("java", comments)).toContain("public class Main");
  });

  test("python uses # comments", () => {
    expect(getStarterCode("python", comments)).toContain("# READ_INPUT");
  });
});

describe("nextCodeOnLanguageChange", () => {
  test("blank editor gets the new starter", () => {
    expect(nextCodeOnLanguageChange("", null, "python", comments)).toBe(
      getStarterCode("python", comments),
    );
    expect(nextCodeOnLanguageChange("  \n", "c", "rust", comments)).toBe(
      getStarterCode("rust", comments),
    );
  });

  test("untouched previous starter is swapped", () => {
    const c = getStarterCode("c", comments);
    expect(nextCodeOnLanguageChange(c, "c", "java", comments)).toBe(
      getStarterCode("java", comments),
    );
  });

  test("edited code is kept", () => {
    const edited = `${getStarterCode("c", comments)}// mine`;
    expect(nextCodeOnLanguageChange(edited, "c", "java", comments)).toBe(
      edited,
    );
  });

  test("code typed before any language is kept", () => {
    expect(nextCodeOnLanguageChange("print(1)", null, "python", comments)).toBe(
      "print(1)",
    );
  });

  test("another language's starter is kept when prev differs", () => {
    const java = getStarterCode("java", comments);
    expect(nextCodeOnLanguageChange(java, "c", "rust", comments)).toBe(java);
  });
});
