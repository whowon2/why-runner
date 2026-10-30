import { describe, expect, test } from "bun:test";
import { IMPORT_TEMPLATE, parseImportPayload } from "./schema";

const valid = {
  title: "Sum",
  description: "Add two numbers.",
  inputs: ["1 2", "3 4"],
  outputs: ["3", "7"],
};

function errorsOf(data: unknown) {
  const result = parseImportPayload(data);
  if (result.ok) throw new Error("expected validation to fail");
  return result.errors;
}

describe("parseImportPayload", () => {
  test("template parses", () => {
    expect(parseImportPayload(IMPORT_TEMPLATE).ok).toBe(true);
  });

  test("bare array and wrapped root are equivalent", () => {
    const bare = parseImportPayload([valid]);
    const wrapped = parseImportPayload({ problems: [valid] });
    expect(bare).toEqual(wrapped);
    expect(bare.ok && bare.problems[0]).toMatchObject({
      visible: [true, false],
      tags: [],
      timeLimitMs: 1000,
      memoryLimitMb: 512,
    });
  });

  test("mismatched inputs/outputs is located at outputs", () => {
    const [err] = errorsOf([{ ...valid, outputs: ["3"] }]);
    expect(err).toMatchObject({ index: 0, title: "Sum", field: "outputs" });
    expect(err.message).toContain("expected 2");
  });

  test("exampleCount larger than test cases is located", () => {
    const [err] = errorsOf([{ ...valid, exampleCount: 5 }]);
    expect(err).toMatchObject({ index: 0, field: "exampleCount" });
  });

  test("visible length mismatch is located at visible", () => {
    const [err] = errorsOf([{ ...valid, visible: [true] }]);
    expect(err).toMatchObject({ index: 0, field: "visible" });
    expect(err.message).toContain("expected 2");
  });

  test("visible is imported as given", () => {
    const result = parseImportPayload([{ ...valid, visible: [false, true] }]);
    expect(result.ok && result.problems[0].visible).toEqual([false, true]);
  });

  test("legacy exampleCount is converted to visible", () => {
    const result = parseImportPayload([
      {
        ...valid,
        inputs: ["a", "b", "c"],
        outputs: ["A", "B", "C"],
        exampleCount: 2,
      },
    ]);
    expect(result.ok && result.problems[0]).toMatchObject({
      visible: [true, true, false],
    });
    expect(result.ok && "exampleCount" in result.problems[0]).toBe(false);
  });

  test("visible and exampleCount together are rejected", () => {
    const [err] = errorsOf([
      { ...valid, visible: [true, false], exampleCount: 1 },
    ]);
    expect(err).toMatchObject({ index: 0, field: "exampleCount" });
  });

  test("unknown key is reported by name", () => {
    const [err] = errorsOf([{ ...valid, input: ["x"] }]);
    expect(err.index).toBe(0);
    expect(err.message).toContain('"input"');
  });

  test("invalid tag names the value", () => {
    const [err] = errorsOf([{ ...valid, tags: ["dp"] }]);
    expect(err).toMatchObject({ index: 0, field: "tags[0]" });
    expect(err.message).toContain('"dp"');
  });

  test("empty payload is rejected at the root", () => {
    const [err] = errorsOf([]);
    expect(err.index).toBeUndefined();
    expect(err.message).toBe("File contains no problems");
    expect(errorsOf({ problems: [] })[0].message).toBe(
      "File contains no problems",
    );
  });

  test("non-array root is rejected", () => {
    expect(errorsOf({ title: "x" })[0].index).toBeUndefined();
  });

  test("all errors are reported, not only the first", () => {
    const { description: _, ...noDescription } = valid;
    const errors = errorsOf([
      valid,
      { ...noDescription, title: "Second" },
      { ...valid, title: "Third", tags: ["dp"] },
    ]);
    expect(errors.map((e) => [e.index, e.title, e.field])).toEqual([
      [1, "Second", "description"],
      [2, "Third", "tags[0]"],
    ]);
  });
});
