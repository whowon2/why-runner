import type { Language } from "@/drizzle/schemas/submissions";
import { type PickMode, pickPerStudent } from "./pick";
import { buildSimilarityReport } from "./report";

export const MAX_REPORT_SUBMISSIONS = 300;

type Row<U> = {
  id: string;
  userId: string;
  status: string;
  createdAt: Date;
  output: string | null;
  code: string;
  language: Language | null;
  user: U;
};

/**
 * Shared tail of the similarity actions: one submission per student, the
 * most recent `MAX_REPORT_SUBMISSIONS` of them compared. `output` is only
 * read to rank `best` picks and never makes it into the result.
 */
export function runSimilarity<U>(rows: Row<U>[], pick: PickMode) {
  const picked = pickPerStudent(rows, pick);
  const compared = picked.slice(0, MAX_REPORT_SUBMISSIONS);
  const { pairs, truncated } = buildSimilarityReport(
    compared.map((s) => ({
      id: s.id,
      studentId: s.userId,
      language: s.language,
      code: s.code,
    })),
  );

  return {
    submissions: compared.map((s) => ({
      id: s.id,
      user: s.user,
      language: s.language,
      status: s.status,
      createdAt: s.createdAt,
      code: s.code,
    })),
    pairs,
    truncatedSubmissions: picked.length > MAX_REPORT_SUBMISSIONS,
    truncatedPairs: truncated,
  };
}

export type SimilarityResult<U> = ReturnType<typeof runSimilarity<U>>;
