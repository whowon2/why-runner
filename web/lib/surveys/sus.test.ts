import { describe, expect, test } from "bun:test";
import { type LikertAnswer, SUS_KEYS } from "./forms";
import { susBand, susScore } from "./sus";

const answers = (pick: (i: number) => LikertAnswer) =>
  Object.fromEntries(SUS_KEYS.map((k, i) => [k, pick(i)])) as Record<
    (typeof SUS_KEYS)[number],
    LikertAnswer
  >;

describe("susScore", () => {
  test("all neutral scores 50", () => {
    expect(susScore(answers(() => 3))).toBe(50);
  });

  test("best answers score 100", () => {
    expect(susScore(answers((i) => (i % 2 === 0 ? 5 : 1)))).toBe(100);
  });

  test("worst answers score 0", () => {
    expect(susScore(answers((i) => (i % 2 === 0 ? 1 : 5)))).toBe(0);
  });

  test("all 5 scores 50 (positive and negative items cancel)", () => {
    expect(susScore(answers(() => 5))).toBe(50);
  });
});

describe("susBand", () => {
  test("boundaries", () => {
    expect(susBand(25)).toBe("worst");
    expect(susBand(50)).toBe("poor");
    expect(susBand(51)).toBe("ok");
    expect(susBand(67.5)).toBe("ok");
    expect(susBand(68)).toBe("good");
    expect(susBand(72.5)).toBe("good");
    expect(susBand(82.5)).toBe("excellent");
    expect(susBand(85)).toBe("best");
  });
});
