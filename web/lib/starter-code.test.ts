import { describe, expect, test } from "bun:test";
import { Language } from "@/drizzle/schemas/submissions";
import {
  getStarterCode,
  isStarterCode,
  nextCodeOnLanguageChange,
} from "./starter-code";

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

describe("nextCodeOnLanguageChange with a saved draft", () => {
  test("untouched code loads the saved draft", () => {
    const c = getStarterCode("c", comments);
    expect(
      nextCodeOnLanguageChange(c, "c", "python", comments, "print(42)"),
    ).toBe("print(42)");
    expect(
      nextCodeOnLanguageChange("", null, "python", comments, "print(42)"),
    ).toBe("print(42)");
  });

  test("edited code ignores the saved draft", () => {
    expect(
      nextCodeOnLanguageChange("x = 1", "python", "c", comments, "int x;"),
    ).toBe("x = 1");
  });

  test("starter in another locale counts as untouched", () => {
    const pt = getStarterCode("c", { read: "Lê a entrada", write: "Escreve" });
    expect(nextCodeOnLanguageChange(pt, "c", "rust", comments)).toBe(
      getStarterCode("rust", comments),
    );
  });
});

describe("isStarterCode", () => {
  test.each(Language.enumValues)("%s starter matches in any locale", (lang) => {
    expect(isStarterCode(getStarterCode(lang, comments), lang)).toBe(true);
    expect(
      isStarterCode(getStarterCode(lang, { read: "lê", write: "escreve" }), lang),
    ).toBe(true);
  });

  test("edited starter does not match", () => {
    const code = getStarterCode("python", comments).replace("a + b", "a * b");
    expect(isStarterCode(code, "python")).toBe(false);
  });

  test("other language's starter does not match", () => {
    expect(isStarterCode(getStarterCode("c", comments), "cpp")).toBe(false);
  });
});
