import { type LikertAnswer, SUS_KEYS } from "./forms";

/**
 * Standard SUS score (Brooke, 1996): odd items contribute `answer - 1`, even
 * items `5 - answer`, the sum is multiplied by 2.5. Range 0–100.
 */
export function susScore(
  answers: Record<(typeof SUS_KEYS)[number], LikertAnswer>,
): number {
  let sum = 0;
  SUS_KEYS.forEach((key, i) => {
    const value = answers[key];
    sum += i % 2 === 0 ? value - 1 : 5 - value;
  });
  return sum * 2.5;
}

export const SUS_BANDS = [
  "worst",
  "poor",
  "ok",
  "good",
  "excellent",
  "best",
] as const;

export type SusBand = (typeof SUS_BANDS)[number];

/** Adjective rating of a SUS score (Bangor, Kortum & Miller, 2009). */
export function susBand(score: number): SusBand {
  if (score <= 25) return "worst";
  if (score < 51) return "poor";
  if (score < 68) return "ok";
  if (score <= 80.3) return "good";
  if (score <= 84) return "excellent";
  return "best";
}
