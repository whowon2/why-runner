import { describe, expect, test } from "bun:test";
import { normalizeAcceptLanguage } from "./accept-language";

describe("normalizeAcceptLanguage", () => {
  test("maps pt-BR and pt to br, keeping order and q-values", () => {
    expect(normalizeAcceptLanguage("pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7")).toBe(
      "br,br;q=0.9,en-US;q=0.8,en;q=0.7",
    );
  });

  test("is case-insensitive and handles other regions", () => {
    expect(normalizeAcceptLanguage("en;q=0.8, PT-pt;q=0.5")).toBe(
      "en;q=0.8,br;q=0.5",
    );
  });

  test("leaves non-Portuguese tags alone", () => {
    expect(normalizeAcceptLanguage("en-US,en;q=0.9")).toBe("en-US,en;q=0.9");
    expect(normalizeAcceptLanguage("es-ES,es;q=0.9")).toBe("es-ES,es;q=0.9");
  });

  test("does not match tags that merely start with pt", () => {
    expect(normalizeAcceptLanguage("ptx")).toBe("ptx");
  });

  test("handles an empty header", () => {
    expect(normalizeAcceptLanguage("")).toBe("");
  });
});
