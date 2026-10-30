import { describe, expect, test } from "bun:test";
import { getStarterCode } from "./starter-code";
import { draftKey, lastLanguageKey, shouldSaveDraft } from "./code-draft";

const exercise = { kind: "exercise", id: "ex-1" } as const;

describe("draft keys", () => {
  test("include user, target and language", () => {
    expect(draftKey("u1", exercise, "python")).toBe(
      "whyrunner:draft:u1:exercise:ex-1:python",
    );
    expect(lastLanguageKey("u1", exercise)).toBe(
      "whyrunner:draft-lang:u1:exercise:ex-1",
    );
  });

  test("differ per user, target kind and language", () => {
    const keys = new Set([
      draftKey("u1", exercise, "python"),
      draftKey("u2", exercise, "python"),
      draftKey("u1", { kind: "problem", id: "ex-1" }, "python"),
      draftKey("u1", exercise, "c"),
    ]);
    expect(keys.size).toBe(4);
  });
});

describe("shouldSaveDraft", () => {
  test("skips blank code", () => {
    expect(shouldSaveDraft("", "python")).toBe(false);
    expect(shouldSaveDraft(" \n\t", "python")).toBe(false);
  });

  test("skips the untouched starter in any locale", () => {
    const en = getStarterCode("python", { read: "Read", write: "Write" });
    const br = getStarterCode("python", { read: "Lê", write: "Escreve" });
    expect(shouldSaveDraft(en, "python")).toBe(false);
    expect(shouldSaveDraft(br, "python")).toBe(false);
  });

  test("saves edited code", () => {
    expect(shouldSaveDraft("print(input())", "python")).toBe(true);
  });
});
