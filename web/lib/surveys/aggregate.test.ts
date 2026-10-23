import { describe, expect, test } from "bun:test";
import { aggregate, median, sampleSd } from "./aggregate";
import { SURVEY_DEFINITIONS } from "./forms";

describe("stats", () => {
  test("median of even and odd counts", () => {
    expect(median([3, 1, 2])).toBe(2);
    expect(median([4, 1, 2, 3])).toBe(2.5);
    expect(median([])).toBeNull();
  });

  test("sample sd needs two values", () => {
    expect(sampleSd([50])).toBeNull();
    expect(sampleSd([40, 60])).toBeCloseTo(14.142, 3);
  });
});

describe("aggregate", () => {
  const definition = SURVEY_DEFINITIONS.contest_participant;

  test("excludes 'na' from item means and counts it separately", () => {
    const results = aggregate(definition, [
      {
        susScore: 70,
        answers: { items: { aiHelp: 4 }, sus: {}, profile: {}, open: {} },
      },
      {
        susScore: 80,
        answers: { items: { aiHelp: "na" }, sus: {}, profile: {}, open: {} },
      },
    ]);
    const aiHelp = results.items.find((i) => i.key === "aiHelp");
    expect(aiHelp?.mean).toBe(4);
    expect(aiHelp?.notApplicable).toBe(1);
    expect(aiHelp?.distribution).toEqual([0, 0, 0, 1, 0]);
    expect(results.sus?.mean).toBe(75);
    expect(results.sus?.band).toBe("good");
  });

  test("no responses has no SUS summary", () => {
    expect(aggregate(definition, []).sus).toBeNull();
  });
});
