import { describe, expect, test } from "bun:test";
import { preferencesPatchSchema } from "./preferences";
import { DEFAULT_PRESET_ID } from "./themes/presets";

const tokens = {
  background: "#111111",
  main: "#4ade80",
  text: "#eeeeee",
  sub: "#888",
  caret: "#eeeeee",
  error: "#da3333",
};

const parse = (input: unknown) => preferencesPatchSchema.safeParse(input);

describe("preferencesPatchSchema", () => {
  test("accepts a partial patch and nulls", () => {
    expect(parse({ editorFontSize: 18 }).success).toBe(true);
    expect(parse({ editorVim: true, colorMode: null }).success).toBe(true);
    expect(parse({}).success).toBe(true);
  });

  test("bounds the font size", () => {
    expect(parse({ editorFontSize: 9 }).success).toBe(false);
    expect(parse({ editorFontSize: 33 }).success).toBe(false);
    expect(parse({ editorFontSize: 14.5 }).success).toBe(false);
    expect(parse({ editorFontSize: 500 }).success).toBe(false);
  });

  test("allows only listed tab sizes and line number modes", () => {
    expect(parse({ editorTabSize: 2 }).success).toBe(true);
    expect(parse({ editorTabSize: 3 }).success).toBe(false);
    expect(parse({ editorLineNumbers: "relative" }).success).toBe(true);
    expect(parse({ editorLineNumbers: "interval" }).success).toBe(false);
  });

  test("rejects unknown keys", () => {
    expect(parse({ userId: "someone-else" }).success).toBe(false);
    expect(parse({ editorFontSize: 14, role: "admin" }).success).toBe(false);
  });

  test("validates themes", () => {
    expect(
      parse({ theme: { mode: "preset", presetId: DEFAULT_PRESET_ID } }).success,
    ).toBe(true);
    expect(parse({ theme: { mode: "preset", presetId: "nope" } }).success).toBe(
      false,
    );
    expect(
      parse({
        theme: { mode: "custom", custom: { light: tokens, dark: tokens } },
      }).success,
    ).toBe(true);
    expect(
      parse({
        theme: {
          mode: "custom",
          custom: { light: tokens, dark: { ...tokens, main: "red" } },
        },
      }).success,
    ).toBe(false);
    expect(
      parse({
        theme: {
          mode: "custom",
          custom: { light: tokens, dark: { ...tokens, extra: "#fff" } },
        },
      }).success,
    ).toBe(false);
  });
});
