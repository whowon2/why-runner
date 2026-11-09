import { describe, expect, test } from "bun:test";
import {
  allowedLanguagesSchema,
  isLanguageAllowed,
  offeredLanguages,
} from "./allowed-languages";

describe("allowed languages", () => {
  test("empty list allows every language", () => {
    expect(isLanguageAllowed([], "java")).toBe(true);
    expect(offeredLanguages([])).toHaveLength(6);
  });

  test("non-empty list restricts", () => {
    expect(isLanguageAllowed(["c", "cpp"], "c")).toBe(true);
    expect(isLanguageAllowed(["c", "cpp"], "python")).toBe(false);
    expect(offeredLanguages(["python", "c"])).toEqual(["c", "python"]);
  });

  test("schema dedupes, orders and rejects unknown languages", () => {
    expect(allowedLanguagesSchema.parse(["rust", "c", "rust"])).toEqual([
      "c",
      "rust",
    ]);
    expect(allowedLanguagesSchema.safeParse(["cobol"]).success).toBe(false);
  });
});
