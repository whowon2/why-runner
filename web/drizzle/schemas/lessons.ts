import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { classroom } from "./classes";
import { problem } from "./problems";
import { Language, submission } from "./submissions";
import { user } from "./users";

/** A professor-curated assignment: a classroom-scoped collection of exercises. */
export const lesson = pgTable("lesson", {
  id: uuid("id").defaultRandom().primaryKey(),
  classroomId: uuid("classroom_id")
    .notNull()
    .references(() => classroom.id, { onDelete: "cascade" }),
  title: text("title").default("Untitled Assignment").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").default("").notNull(),
  dueDate: timestamp("due_date"),
  isPublished: boolean("is_published").default(false).notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type Lesson = typeof lesson.$inferSelect;
export type CreateLessonInput = typeof lesson.$inferInsert;

export const lessonRelations = relations(lesson, ({ one, many }) => ({
  classroom: one(classroom, {
    fields: [lesson.classroomId],
    references: [classroom.id],
  }),
  exercises: many(exercise),
  submissions: many(lessonSubmission),
}));

/** A student submitting the whole lesson (every exercise's current answer) to the professor at once. */
export const lessonSubmission = pgTable(
  "lesson_submission",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
    // Set once the professor grades this student's submission (only
    // possible after the lesson's due date, see `getLessonReview`). `score`
    // is a professor-assigned integer, not auto-computed from pass/fail.
    reviewedAt: timestamp("reviewed_at"),
    score: integer("score"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonId] })],
);

export type LessonSubmission = typeof lessonSubmission.$inferSelect;

export const lessonSubmissionRelations = relations(
  lessonSubmission,
  ({ one }) => ({
    user: one(user, {
      fields: [lessonSubmission.userId],
      references: [user.id],
    }),
    lesson: one(lesson, {
      fields: [lessonSubmission.lessonId],
      references: [lesson.id],
    }),
  }),
);

/** One problem entry inside a lesson. */
export const exercise = pgTable(
  "exercise",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    problemId: uuid("problem_id")
      .notNull()
      .references(() => problem.id, { onDelete: "cascade" }),
    slug: text("slug").notNull().unique(),
    order: integer("order").default(0).notNull(),
    primaryLanguage: Language("primary_language"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    // Same problem can't be added to the same lesson twice.
    uniqueIndex("exercise_lesson_id_problem_id_unique").on(
      table.lessonId,
      table.problemId,
    ),
  ],
);

export type Exercise = typeof exercise.$inferSelect;
export type CreateExerciseInput = typeof exercise.$inferInsert;

export const exerciseRelations = relations(exercise, ({ one, many }) => ({
  lesson: one(lesson, {
    fields: [exercise.lessonId],
    references: [lesson.id],
  }),
  problem: one(problem, {
    fields: [exercise.problemId],
    references: [problem.id],
  }),
  completions: many(exerciseCompletion),
}));

/**
 * Per-exercise snapshot of what a student sent, written by `submitLesson`
 * when the whole lesson is submitted — records which submission (if any)
 * that exercise's problem had at submit time, for the professor's review page.
 */
export const exerciseCompletion = pgTable(
  "exercise_completion",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    exerciseId: uuid("exercise_id")
      .notNull()
      .references(() => exercise.id, { onDelete: "cascade" }),
    submissionId: uuid("submission_id").references(() => submission.id, {
      onDelete: "set null",
    }),
    language: Language(),
    completedAt: timestamp("completed_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.exerciseId] })],
);

export type ExerciseCompletion = typeof exerciseCompletion.$inferSelect;

export const exerciseCompletionRelations = relations(
  exerciseCompletion,
  ({ one }) => ({
    user: one(user, {
      fields: [exerciseCompletion.userId],
      references: [user.id],
    }),
    exercise: one(exercise, {
      fields: [exerciseCompletion.exerciseId],
      references: [exercise.id],
    }),
    submission: one(submission, {
      fields: [exerciseCompletion.submissionId],
      references: [submission.id],
    }),
  }),
);
