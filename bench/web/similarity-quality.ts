// Benchmark 7: scores every labelled pair of bench/plagiarism/corpus.json
// with the app's own similarity code (web/lib/similarity). Each pair is run
// as a two-submission report, i.e. without the class boilerplate filter
// (it needs >= 4 submissions). Also scores each problem+language "class"
// (3 originals + their 18 copies) with the filter on, the way the teacher's
// report runs.
//   bun bench/web/similarity-quality.ts
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildSimilarityReport } from "../../web/lib/similarity/report";

type Doc = { id: string; problem: string; lang: "c" | "java" | "python"; level: string; code: string };
type Pair = { a: string; b: string; label: string; level: string; lang: string };

const root = join(import.meta.dir, "..");
const { docs, pairs } = JSON.parse(readFileSync(join(root, "plagiarism/corpus.json"), "utf8")) as {
  docs: Doc[];
  pairs: Pair[];
};
const byId = new Map(docs.map((d) => [d.id, d]));

const rows = ["a,b,label,level,lang,similarity,mode"];
for (const p of pairs) {
  const a = byId.get(p.a)!;
  const b = byId.get(p.b)!;
  const { pairs: got } = buildSimilarityReport([
    { id: a.id, studentId: "s1", language: a.lang, code: a.code },
    { id: b.id, studentId: "s2", language: b.lang, code: b.code },
  ]);
  rows.push(`${p.a},${p.b},${p.label},${p.level},${p.lang},${(got[0]?.similarity ?? 0).toFixed(4)},pair`);
}

// Class mode: one report per problem+language, every doc a different student.
const want = new Map(pairs.filter((p) => p.label !== "other_problem").map((p) => [`${p.a}|${p.b}`, p]));
const groups = new Map<string, Doc[]>();
for (const d of docs) {
  const k = `${d.problem}|${d.lang}`;
  groups.set(k, [...(groups.get(k) ?? []), d]);
}
for (const group of groups.values()) {
  const { pairs: got } = buildSimilarityReport(
    group.map((d) => ({ id: d.id, studentId: d.id, language: d.lang, code: d.code })),
    { maxPairs: 100000 },
  );
  const sim = new Map(got.map((g) => [`${g.a}|${g.b}`, g.similarity]));
  for (const [key, p] of want) {
    if (!byId.get(p.a) || group[0].problem !== byId.get(p.a)!.problem || group[0].lang !== p.lang) continue;
    const s = sim.get(key) ?? sim.get(`${p.b}|${p.a}`) ?? 0;
    rows.push(`${p.a},${p.b},${p.label},${p.level},${p.lang},${s.toFixed(4)},class`);
  }
}

writeFileSync(join(root, "results/plagiarism_quality.csv"), `${rows.join("\n")}\n`);
console.log(`${rows.length - 1} scored pairs`);
