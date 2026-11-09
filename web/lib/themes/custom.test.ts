import { describe, expect, test } from "bun:test";
import { preferencesPatchSchema } from "../preferences";
import { editableTokens, toHexTokens, withCustomTokens } from "./custom";
import { getPresetById } from "./presets";
import type { StoredTheme, ThemeTokens } from "./types";

// Stand-in for the canvas conversion: any non-hex color becomes #123456.
const fakeHex = (color: string) => (color.startsWith("#") ? color : "#123456");
const failHex = () => null;

const edited: ThemeTokens = {
  background: "#101820",
  main: "#4ade80",
  text: "#eeeeee",
  sub: "#888888",
  caret: "#eeeeee",
  error: "#da3333",
};

const preset: StoredTheme = { mode: "preset", presetId: "linux-rice" };

describe("toHexTokens", () => {
  test("keeps hex and converts the rest", () => {
    const out = toHexTokens(getPresetById("linux-rice").light, fakeHex);
    expect(out && Object.values(out).every((c) => c === "#123456")).toBe(true);
    expect(toHexTokens(edited, failHex)).toEqual(edited);
  });

  test("null when a color can't be converted", () => {
    expect(toHexTokens(getPresetById("linux-rice").dark, failHex)).toBeNull();
  });
});

describe("withCustomTokens", () => {
  test("switching from an oklch preset saves both modes as hex", () => {
    const next = withCustomTokens(preset, "dark", edited, fakeHex);
    expect(next.mode).toBe("custom");
    if (next.mode !== "custom") return;
    expect(next.custom.dark).toEqual(edited);
    expect(next.custom.light.background).toBe("#123456");
    // What the account save validates.
    expect(preferencesPatchSchema.safeParse({ theme: next }).success).toBe(
      true,
    );
  });

  test("editing one mode keeps the other mode's colors", () => {
    const dark = withCustomTokens(preset, "dark", edited, fakeHex);
    const light: ThemeTokens = { ...edited, background: "#fafafa" };
    const both = withCustomTokens(dark, "light", light, fakeHex);
    expect(both).toEqual({
      mode: "custom",
      custom: { dark: edited, light },
    });
  });

  test("repairs an earlier non-hex slot", () => {
    const broken: StoredTheme = {
      mode: "custom",
      custom: { dark: edited, light: getPresetById("nord").light },
    };
    const next = withCustomTokens(broken, "dark", edited, fakeHex);
    expect(preferencesPatchSchema.safeParse({ theme: next }).success).toBe(
      true,
    );
  });

  test("falls back to the edited tokens when conversion fails", () => {
    const next = withCustomTokens(preset, "dark", edited, failHex);
    expect(next).toEqual({
      mode: "custom",
      custom: { dark: edited, light: edited },
    });
  });
});

describe("editableTokens", () => {
  test("starts from the mode's own colors, not the other mode's", () => {
    const stored = withCustomTokens(
      preset,
      "light",
      { ...edited, background: "#fafafa" },
      fakeHex,
    );
    expect(editableTokens(stored, "light", fakeHex)?.background).toBe(
      "#fafafa",
    );
    expect(editableTokens(stored, "dark", fakeHex)?.background).toBe("#123456");
  });
});
