// Benchmark 11: time to compute contest standings and a class gradebook
// (+ its CSV) with the app's own pure functions, for synthetic contests and
// classes far larger than a real class. DB time is not included (see README).
//   bun bench/web/standings-gradebook.ts
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { computeStandings } from "../../web/lib/contest/standings";
import { buildGradebook, gradebookToCsv } from "../../web/lib/gradebook";

let seed = 7;
const rand = () => {
  seed = (seed * 1103515245 + 12345) % 2 ** 31;
  return seed / 2 ** 31;
};
const pick = <T>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)];
const STATUSES = ["PASSED", "WRONG_ANSWER", "WRONG_ANSWER", "TIME_LIMIT_EXCEEDED", "RUNTIME_ERROR", "COMPILATION_ERROR"] as const;
const REPS = 7;
const rows = ["kind,students,items,records,rep,ms"];

const median = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const people = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ id: `u${i}`, name: `Student ${i}`, username: `s${i}`, image: null }));

// Standings: P problems, each student makes ~S submissions per problem over 3 h.
for (const [students, problems, perProblem] of [[30, 6, 3], [100, 8, 4], [300, 10, 5], [1000, 12, 5]] as const) {
  const start = new Date("2026-10-29T13:00:00Z");
  const problemIds = Array.from({ length: problems }, (_, i) => `p${i}`);
  const participants = people(students);
  const submissions = participants.flatMap((u) =>
    problemIds.flatMap((p) =>
      Array.from({ length: Math.floor(rand() * perProblem * 2) }, (_, k) => ({
        id: `${u.id}-${p}-${k}`,
        userId: u.id,
        problemId: p,
        status: pick(STATUSES),
        createdAt: new Date(start.getTime() + rand() * 3 * 3600_000),
      })),
    ),
  );
  const times: number[] = [];
  for (let rep = 0; rep < REPS; rep++) {
    const t0 = performance.now();
    computeStandings({ contest: { startDate: start, endDate: new Date(start.getTime() + 3 * 3600_000) }, problemIds, participants, submissions });
    const ms = performance.now() - t0;
    times.push(ms);
    rows.push(`standings,${students},${problems},${submissions.length},${rep},${ms.toFixed(3)}`);
  }
  console.log("standings", students, problems, submissions.length, median(times).toFixed(2), "ms");
}

// Gradebook: L lessons x E exercises; every student hands in ~80% of lessons.
for (const [students, lessonsN, exercises] of [[30, 10, 5], [100, 20, 5], [300, 30, 6], [1000, 40, 6]] as const) {
  const lessons = Array.from({ length: lessonsN }, (_, l) => ({
    id: `l${l}`,
    title: `Aula ${l}`,
    slug: `aula-${l}`,
    dueDate: null,
    exercises: Array.from({ length: exercises }, (_, e) => ({ id: `l${l}e${e}`, problemTitle: `Problema ${e}` })),
  }));
  const studentsList = people(students);
  const lessonSubmissions = studentsList.flatMap((u) =>
    lessons.filter(() => rand() < 0.8).map((l) => ({ userId: u.id, lessonId: l.id })),
  );
  const completions = lessonSubmissions.flatMap(({ userId, lessonId }) =>
    lessons
      .find((l) => l.id === lessonId)!
      .exercises.map((e) => {
        const total = 5;
        const passed = Math.floor(rand() * 6);
        return {
          userId,
          exerciseId: e.id,
          output: JSON.stringify({ passed: passed === total, total_tests: total, passed_count: passed }),
        };
      }),
  );
  const times: number[] = [];
  for (let rep = 0; rep < REPS; rep++) {
    const t0 = performance.now();
    const gb = buildGradebook({ lessons, students: studentsList, lessonSubmissions, completions });
    gradebookToCsv(gb);
    const ms = performance.now() - t0;
    times.push(ms);
    rows.push(`gradebook+csv,${students},${lessonsN * exercises},${completions.length},${rep},${ms.toFixed(3)}`);
  }
  console.log("gradebook", students, lessonsN * exercises, completions.length, median(times).toFixed(2), "ms");
}

writeFileSync(join(import.meta.dir, "../results/web_compute.csv"), `${rows.join("\n")}\n`);
