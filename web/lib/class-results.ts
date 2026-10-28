import type { Language, Submission } from "@/drizzle/schema";
import { toCsv } from "@/lib/contest/export-bundle";
import { computeExerciseScore, parseTestCounts } from "@/lib/exercise-score";
import { formatScore } from "@/lib/gradebook";

export type ClassResultsLesson = {
  id: string;
  title: string;
  dueDate: Date | null;
  exercises: { id: string; problemCode: string; problemTitle: string }[];
};

export type ClassResultsStudent = {
  id: string;
  name: string;
  username: string;
};

export type ClassResultsInput = {
  /** Published lessons, already in display order, exercises in lesson order. */
  lessons: ClassResultsLesson[];
  students: ClassResultsStudent[];
  lessonSubmissions: {
    userId: string;
    lessonId: string;
    submittedAt: Date;
    reviewedAt: Date | null;
  }[];
  /** `exercise_completion` snapshots with their submission (if any). */
  completions: {
    userId: string;
    exerciseId: string;
    feedback: string | null;
    submission: {
      status: Submission["status"];
      output: string | null;
      language: Language | null;
      createdAt: Date;
    } | null;
  }[];
  /** Every submission per user × exercise, aggregated. */
  activity: {
    userId: string;
    exerciseId: string;
    attempts: number;
    lastAttemptAt: Date | null;
    everPassed: boolean;
  }[];
};

export type LessonState = "not_submitted" | "on_time" | "late";

export type ClassResultRow = {
  student: ClassResultsStudent;
  lesson: ClassResultsLesson;
  exercise: ClassResultsLesson["exercises"][number];
  /** 1-based position within the lesson. */
  position: number;
  lessonState: LessonState;
  lessonSubmittedAt: Date | null;
  reviewedAt: Date | null;
  verdict: Submission["status"] | null;
  passedTests: number | null;
  totalTests: number | null;
  /** Same as the gradebook cell: null = lesson not submitted. */
  score: number | null;
  language: Language | null;
  gradedSubmissionAt: Date | null;
  feedback: string | null;
  attempts: number;
  lastAttemptAt: Date | null;
  everPassed: boolean;
};

/**
 * One row per student × published exercise. Graded columns come from the
 * hand-in snapshot (same as the gradebook), activity from every submission.
 */
export function buildClassResults(input: ClassResultsInput): ClassResultRow[] {
  const handIns = new Map(
    input.lessonSubmissions.map((s) => [`${s.userId}:${s.lessonId}`, s]),
  );
  const completions = new Map(
    input.completions.map((c) => [`${c.userId}:${c.exerciseId}`, c]),
  );
  const activity = new Map(
    input.activity.map((a) => [`${a.userId}:${a.exerciseId}`, a]),
  );

  const students = [...input.students].sort(
    (a, b) =>
      a.name.localeCompare(b.name) || a.username.localeCompare(b.username),
  );

  return students.flatMap((student) =>
    input.lessons.flatMap((lesson) => {
      const handIn = handIns.get(`${student.id}:${lesson.id}`);
      const lessonState: LessonState = !handIn
        ? "not_submitted"
        : lesson.dueDate && handIn.submittedAt > lesson.dueDate
          ? "late"
          : "on_time";

      return lesson.exercises.map((exercise, i) => {
        const key = `${student.id}:${exercise.id}`;
        const graded = handIn ? completions.get(key)?.submission : undefined;
        const counts = parseTestCounts(graded?.output);
        const act = activity.get(key);

        return {
          student,
          lesson,
          exercise,
          position: i + 1,
          lessonState,
          lessonSubmittedAt: handIn?.submittedAt ?? null,
          reviewedAt: handIn?.reviewedAt ?? null,
          verdict: graded?.status ?? null,
          passedTests: counts?.passed ?? null,
          totalTests: counts?.total ?? null,
          score: handIn ? computeExerciseScore(graded?.output) : null,
          language: graded?.language ?? null,
          gradedSubmissionAt: graded?.createdAt ?? null,
          feedback: completions.get(key)?.feedback ?? null,
          attempts: act?.attempts ?? 0,
          lastAttemptAt: act?.lastAttemptAt ?? null,
          everPassed: act?.everPassed ?? false,
        };
      });
    }),
  );
}

const iso = (d: Date | null) => (d ? d.toISOString() : "");

export const CLASS_RESULTS_HEADER = [
  "student_name",
  "username",
  "lesson",
  "lesson_due_date",
  "exercise_position",
  "problem_code",
  "problem_title",
  "lesson_state",
  "lesson_submitted_at",
  "reviewed_at",
  "verdict",
  "passed_tests",
  "total_tests",
  "score",
  "language",
  "graded_submission_at",
  "attempts",
  "last_attempt_at",
  "ever_passed",
  "feedback",
];

export function classResultsToCsv(rows: ClassResultRow[]): string {
  return toCsv([
    CLASS_RESULTS_HEADER,
    ...rows.map((r) => [
      r.student.name,
      r.student.username,
      r.lesson.title,
      r.lesson.dueDate ? r.lesson.dueDate.toISOString().slice(0, 10) : "",
      r.position,
      r.exercise.problemCode,
      r.exercise.problemTitle,
      r.lessonState,
      iso(r.lessonSubmittedAt),
      iso(r.reviewedAt),
      r.verdict ?? "",
      r.passedTests ?? "",
      r.totalTests ?? "",
      formatScore(r.score),
      r.language ?? "",
      iso(r.gradedSubmissionAt),
      r.attempts,
      iso(r.lastAttemptAt),
      r.everPassed,
      r.feedback ?? "",
    ]),
  ]);
}
