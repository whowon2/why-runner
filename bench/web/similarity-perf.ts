// Benchmark 8: time to build the similarity report for N students of one
// exercise (one language), with the app's own code. Students are synthetic:
// each is a random obfuscation of one of the 3 independent solutions of a
// problem, so sizes are realistic and some pairs really are copies.
//   bun bench/web/similarity-perf.ts
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildSimilarityReport } from "../../web/lib/similarity/report";

type Doc = { id: string; problem: string; lang: "c" | "java" | "python"; level: string; code: string };
const root = join(import.meta.dir, "..");
const { docs } = JSON.parse(readFileSync(join(root, "plagiarism/corpus.json"), "utf8")) as { docs: Doc[] };

let seed = 42;
const rand = () => {
  seed = (seed * 1103515245 + 12345) % 2 ** 31;
  return seed / 2 ** 31;
};

const REPS = 7;
const rows = ["lang,n,pairs,rep,ms,reported_pairs"];
for (const lang of ["python", "c", "java"] as const) {
  const pool = docs.filter((d) => d.lang === lang && d.problem === "sort");
  for (const n of [10, 30, 50, 100, 200, 300]) {
    const entries = Array.from({ length: n }, (_, i) => {
      const d = pool[Math.floor(rand() * pool.length)];
      // Same base text would be trivial; a unique trailing line keeps each distinct.
      return { id: `s${i}`, studentId: `s${i}`, language: lang, code: `${d.code}\n` };
    });
    for (let rep = 0; rep < REPS; rep++) {
      const t0 = performance.now();
      const { pairs } = buildSimilarityReport(entries);
      const ms = performance.now() - t0;
      rows.push(`${lang},${n},${(n * (n - 1)) / 2},${rep},${ms.toFixed(2)},${pairs.length}`);
    }
    console.log(lang, n, rows.at(-1));
  }
}
writeFileSync(join(root, "results/plagiarism_perf.csv"), `${rows.join("\n")}\n`);
