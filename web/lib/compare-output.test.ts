import { describe, expect, test } from "bun:test";
import { outputsMatch } from "./compare-output";

// Same cases as `judge/src/compare.rs`'s tests.
const EPS = 1e-6;

describe("outputsMatch", () => {
  test("exact trims only the ends", () => {
    expect(outputsMatch("exact", EPS, "1 2\n", "1 2")).toBe(true);
    expect(outputsMatch("exact", EPS, "1  2", "1 2")).toBe(false);
    expect(outputsMatch("exact", EPS, "1\n2", "1 2")).toBe(false);
  });

  test("tokens ignores spacing and line breaks", () => {
    expect(outputsMatch("tokens", EPS, "1\n2 3\n\n", "1 2\n3")).toBe(true);
    expect(outputsMatch("tokens", EPS, "a\r\nb\r\n", "a\nb")).toBe(true);
    expect(outputsMatch("tokens", EPS, "1 2", "1 2 3")).toBe(false);
    expect(outputsMatch("tokens", EPS, "YES", "yes")).toBe(false);
    expect(outputsMatch("tokens", EPS, "", "  \n")).toBe(true);
  });

  test("float compares numbers within epsilon", () => {
    expect(outputsMatch("float", EPS, "0.3333331", "0.333333")).toBe(true);
    expect(outputsMatch("float", EPS, "2.5000000001 x", "2.5 x")).toBe(true);
    expect(outputsMatch("float", EPS, "1e3", "1000.0")).toBe(true);
    expect(outputsMatch("float", EPS, "1000000.5", "1000000")).toBe(true);
    expect(outputsMatch("float", EPS, "1000002", "1000000")).toBe(false);
    expect(outputsMatch("float", EPS, "0.51", "0.5")).toBe(false);
    expect(outputsMatch("float", EPS, "1 2", "1")).toBe(false);
    expect(outputsMatch("float", EPS, "yes 1.0", "YES 1.0")).toBe(false);
    expect(outputsMatch("float", EPS, "YES 1.0000001", "YES 1.0")).toBe(true);
    expect(outputsMatch("float", EPS, "nan", "0")).toBe(false);
    expect(outputsMatch("float", EPS, "0x10", "16")).toBe(false);
  });

  test("checker has no browser verdict", () => {
    expect(outputsMatch("checker", EPS, "1", "1")).toBeNull();
  });
});
