import type { Language } from "@/drizzle/schemas/submissions";
import { type MatchRegion, type PreparedDoc, comparePair } from "./compare";
import { DEFAULT_K, DEFAULT_W, fingerprint } from "./fingerprint";
import { tokenize } from "./tokenize";

export type ReportEntry = {
  id: string;
  studentId: string;
  language: Language | null;
  code: string;
};

export type SimilarityPair = {
  /** Entry ids; `a` is the one listed first in the input. */
  a: string;
  b: string;
  similarity: number;
  coverageA: number;
  coverageB: number;
  regions: MatchRegion[];
};

export type ReportOptions = {
  k?: number;
  w?: number;
  /** Fingerprints in more than this share of entries count as boilerplate. */
  commonShare?: number;
  /** The boilerplate filter only applies from this many entries on. */
  commonMinEntries?: number;
  maxPairs?: number;
};

export const MAX_REPORT_PAIRS = 500;

/**
 * Compares every pair of entries from different students in the same
 * language, ignoring fingerprints that most of the class shares (the
 * problem's skeleton). Pairs with no match are dropped; the rest are sorted
 * by similarity, highest first, and capped at `maxPairs`.
 */
export function buildSimilarityReport(
  entries: ReportEntry[],
  {
    k = DEFAULT_K,
    w = DEFAULT_W,
    commonShare = 0.5,
    commonMinEntries = 4,
    maxPairs = MAX_REPORT_PAIRS,
  }: ReportOptions = {},
): { pairs: SimilarityPair[]; truncated: boolean } {
  const docs: PreparedDoc[] = entries.map((e) => {
    const tokens = tokenize(e.code, e.language);
    return { tokens, fingerprints: fingerprint(tokens, k, w) };
  });

  // Boilerplate is judged per language: a C skeleton says nothing about the
  // Python answers, and mixing them would dilute the shares.
  const ignoreByLanguage = new Map<string, Set<number>>();
  const byLanguage = new Map<string, PreparedDoc[]>();
  entries.forEach((e, i) => {
    const key = e.language ?? "";
    const group = byLanguage.get(key);
    if (group) group.push(docs[i]);
    else byLanguage.set(key, [docs[i]]);
  });
  for (const [language, group] of byLanguage) {
    if (group.length < commonMinEntries) continue;
    const ignore = new Set<number>();
    ignoreByLanguage.set(language, ignore);
    const docFreq = new Map<number, number>();
    for (const doc of group) {
      for (const hash of new Set(doc.fingerprints.map((f) => f.hash))) {
        docFreq.set(hash, (docFreq.get(hash) ?? 0) + 1);
      }
    }
    for (const [hash, count] of docFreq) {
      if (count / group.length > commonShare) ignore.add(hash);
    }
  }

  const pairs: SimilarityPair[] = [];
  for (let x = 0; x < entries.length; x++) {
    for (let y = x + 1; y < entries.length; y++) {
      const ea = entries[x];
      const eb = entries[y];
      if (ea.studentId === eb.studentId) continue;
      if ((ea.language ?? null) !== (eb.language ?? null)) continue;
      const result = comparePair(docs[x], docs[y], {
        k,
        ignore: ignoreByLanguage.get(ea.language ?? ""),
      });
      if (result.similarity === 0) continue;
      pairs.push({ a: ea.id, b: eb.id, ...result });
    }
  }

  pairs.sort((p, q) => q.similarity - p.similarity);
  return {
    pairs: pairs.slice(0, maxPairs),
    truncated: pairs.length > maxPairs,
  };
}
