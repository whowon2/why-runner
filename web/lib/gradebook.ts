import { toCsv } from "@/lib/contest/export-bundle";
import { computeExerciseScore } from "@/lib/exercise-score";

export type GradebookLesson = {
  id: string;
  title: string;
  slug: string;
  dueDate: Date | null;
  exercises: { id: string; problemTitle: string }[];
};

export type GradebookStudent = {
  id: string;
  name: string;
  username: string;
  image: string | null;
};

export type GradebookInput = {
  /** Published lessons, already in display order, exercises in lesson order. */
  lessons: GradebookLesson[];
  students: GradebookStudent[];
  /** Which students handed in which lesson (`lesson_submission`). */
  lessonSubmissions: { userId: string; lessonId: string }[];
  /** `exercise_completion` snapshots with their submission's judge output. */
  completions: { userId: string; exerciseId: string; output: string | null }[];
};

export type GradebookRow = {
  student: GradebookStudent;
  /** One per exercise, in column order; null = lesson not submitted. */
  cells: (number | null)[];
  /** One per lesson; null = lesson not submitted. */
  lessonTotals: (number | null)[];
  /** Sum of every exercise score, not-submitted counting as 0. */
  total: number;
};

export type Gradebook = {
  lessons: GradebookLesson[];
  rows: GradebookRow[];
  /** Highest possible total: one point per exercise column. */
  maxTotal: number;
};

/**
 * Students × exercises matrix. Scores come from the same snapshot and
 * formula as lesson review (`computeExerciseScore` on the completion's
 * submission, lesson total = sum of fractions), so the two never disagree.
 */
export function buildGradebook(input: GradebookInput): Gradebook {
  const submitted = new Set(
    input.lessonSubmissions.map((s) => `${s.userId}:${s.lessonId}`),
  );
  const outputByCell = new Map(
    input.completions.map((c) => [`${c.userId}:${c.exerciseId}`, c.output]),
  );

  const students = [...input.students].sort(
    (a, b) =>
      a.name.localeCompare(b.name) || a.username.localeCompare(b.username),
  );

  const rows = students.map((student) => {
    const cells: (number | null)[] = [];
    const lessonTotals: (number | null)[] = [];

    for (const lesson of input.lessons) {
      if (!submitted.has(`${student.id}:${lesson.id}`)) {
        for (const _ of lesson.exercises) cells.push(null);
        lessonTotals.push(null);
        continue;
      }
      let lessonTotal = 0;
      for (const e of lesson.exercises) {
        const score = computeExerciseScore(
          outputByCell.get(`${student.id}:${e.id}`),
        );
        cells.push(score);
        lessonTotal += score;
      }
      lessonTotals.push(lessonTotal);
    }

    return {
      student,
      cells,
      lessonTotals,
      total: lessonTotals.reduce<number>((sum, t) => sum + (t ?? 0), 0),
    };
  });

  return {
    lessons: input.lessons,
    rows,
    maxTotal: input.lessons.reduce((n, l) => n + l.exercises.length, 0),
  };
}

/** Score as written to CSV: dot decimal, at most 4 places, "" when absent. */
export function formatScore(score: number | null) {
  return score === null ? "" : String(Math.round(score * 10000) / 10000);
}

/**
 * One row per student: name, username, every exercise, every lesson
 * subtotal, total and max. Same layout as the gradebook page.
 */
export function gradebookToCsv(gradebook: Gradebook): string {
  const header = [
    "name",
    "username",
    ...gradebook.lessons.flatMap((l) =>
      l.exercises.map((e) => `${l.title} / ${e.problemTitle}`),
    ),
    ...gradebook.lessons.map((l) => `${l.title} (total)`),
    "total",
    "max",
  ];

  const rows = gradebook.rows.map((r) => [
    r.student.name,
    r.student.username,
    ...r.cells.map(formatScore),
    ...r.lessonTotals.map(formatScore),
    formatScore(r.total),
    gradebook.maxTotal,
  ]);

  return toCsv([header, ...rows]);
}
