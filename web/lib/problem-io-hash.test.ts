import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { computeIoHash } from "./problem-io-hash";

const inputs = ["1", "2"];
const outputs = ["1", "2"];

describe("computeIoHash", () => {
  test("exact mode keeps the pre-compare-modes hash", () => {
    const legacy = createHash("sha256")
      .update(JSON.stringify({ inputs, outputs }))
      .digest("hex");
    expect(computeIoHash(inputs, outputs)).toBe(legacy);
    expect(
      computeIoHash(inputs, outputs, { compareMode: "exact", floatEpsilon: 1 }),
    ).toBe(legacy);
  });

  test("changing comparison settings changes the hash", () => {
    const tokens = computeIoHash(inputs, outputs, {
      compareMode: "tokens",
      floatEpsilon: 1e-6,
    });
    const float = (eps: number) =>
      computeIoHash(inputs, outputs, { compareMode: "float", floatEpsilon: eps });
    const checker = (code: string) =>
      computeIoHash(inputs, outputs, {
        compareMode: "checker",
        floatEpsilon: 1e-6,
        checker: { language: "python", code },
      });

    expect(tokens).not.toBe(computeIoHash(inputs, outputs));
    expect(float(1e-6)).not.toBe(tokens);
    expect(float(1e-6)).not.toBe(float(1e-4));
    expect(checker("a")).not.toBe(checker("b"));
    // Epsilon only matters in float mode.
    expect(
      computeIoHash(inputs, outputs, { compareMode: "tokens", floatEpsilon: 1 }),
    ).toBe(tokens);
  });
});
