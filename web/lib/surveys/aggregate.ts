import {
  LIKERT_VALUES,
  NOT_APPLICABLE,
  SUS_KEYS,
  type SurveyDefinition,
} from "./forms";
import { type SusBand, susBand } from "./sus";

export type LikertSummary = {
  key: string;
  /** Count of answers 1..5, in order. */
  distribution: number[];
  mean: number | null;
  notApplicable: number;
};

export type ProfileSummary =
  | { key: string; kind: "single" | "multi"; counts: Record<string, number> }
  | { key: string; kind: "text"; values: string[] };

export type FormResults = {
  count: number;
  sus: {
    mean: number;
    median: number;
    sd: number | null;
    band: SusBand;
  } | null;
  susItems: LikertSummary[];
  items: LikertSummary[];
  profile: ProfileSummary[];
  open: { key: string; answers: string[] }[];
};

type ResponseRow = {
  answers: Record<string, unknown>;
  susScore: number;
};

export function mean(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Sample standard deviation; `null` below two values. */
export function sampleSd(values: number[]): number | null {
  const m = mean(values);
  if (m === null || values.length < 2) return null;
  const sq = values.reduce((acc, v) => acc + (v - m) ** 2, 0);
  return Math.sqrt(sq / (values.length - 1));
}

function section(row: ResponseRow, name: string): Record<string, unknown> {
  const value = row.answers[name];
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function likertSummary(key: string, raw: unknown[]): LikertSummary {
  const distribution = LIKERT_VALUES.map(() => 0);
  const numbers: number[] = [];
  let notApplicable = 0;
  for (const value of raw) {
    if (value === NOT_APPLICABLE) notApplicable++;
    else if (typeof value === "number" && value >= 1 && value <= 5) {
      distribution[value - 1]++;
      numbers.push(value);
    }
  }
  return { key, distribution, mean: mean(numbers), notApplicable };
}

/** Aggregates one form's responses (any version) against its definition. */
export function aggregate(
  definition: SurveyDefinition,
  rows: ResponseRow[],
): FormResults {
  const scores = rows.map((r) => r.susScore);
  const susMean = mean(scores);

  return {
    count: rows.length,
    sus:
      susMean === null
        ? null
        : {
            mean: susMean,
            median: median(scores) ?? susMean,
            sd: sampleSd(scores),
            band: susBand(susMean),
          },
    susItems: SUS_KEYS.map((key) =>
      likertSummary(
        key,
        rows.map((r) => section(r, "sus")[key]),
      ),
    ),
    items: definition.items.map((item) =>
      likertSummary(
        item.key,
        rows.map((r) => section(r, "items")[item.key]),
      ),
    ),
    profile: definition.profile.map((q): ProfileSummary => {
      const raw = rows.map((r) => section(r, "profile")[q.key]);
      if (q.kind === "text") {
        return {
          key: q.key,
          kind: "text",
          values: raw.filter((v): v is string => typeof v === "string" && !!v),
        };
      }
      const counts = Object.fromEntries(q.options.map((o) => [o, 0]));
      for (const value of raw) {
        for (const v of Array.isArray(value) ? value : [value]) {
          if (typeof v === "string" && v in counts) counts[v]++;
        }
      }
      return { key: q.key, kind: q.kind, counts };
    }),
    open: definition.open.map((q) => ({
      key: q.key,
      answers: rows
        .map((r) => section(r, "open")[q.key])
        .filter((v): v is string => typeof v === "string" && v.trim() !== ""),
    })),
  };
}
