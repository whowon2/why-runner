import { relations } from "drizzle-orm";
import {
  boolean,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { classroom } from "./classes";
import { problem } from "./problems";
import { Language, submission } from "./submissions";
import { user } from "./users";

export const lessonTrack = pgTable("lesson_track", {
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

export type LessonTrack = typeof lessonTrack.$inferSelect;
export type CreateLessonTrackInput = typeof lessonTrack.$inferInsert;

export const lessonTrackRelations = relations(lessonTrack, ({ one, many }) => ({
  classroom: one(classroom, {
    fields: [lessonTrack.classroomId],
    references: [classroom.id],
  }),
  lessons: many(lesson),
  submissions: many(lessonTrackSubmission),
}));

/** A student submitting the whole assignment (every exercise's current answer) to the professor at once. */
export const lessonTrackSubmission = pgTable(
  "lesson_track_submission",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    trackId: uuid("track_id")
      .notNull()
      .references(() => lessonTrack.id, { onDelete: "cascade" }),
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
    // Set once the professor grades this student's submission (only
    // possible after the track's due date, see `getTrackReview`). `score`
    // is a professor-assigned integer, not auto-computed from pass/fail.
    reviewedAt: timestamp("reviewed_at"),
    score: integer("score"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.trackId] })],
);

export type LessonTrackSubmission = typeof lessonTrackSubmission.$inferSelect;

export const lessonTrackSubmissionRelations = relations(
  lessonTrackSubmission,
  ({ one }) => ({
    user: one(user, {
      fields: [lessonTrackSubmission.userId],
      references: [user.id],
    }),
    track: one(lessonTrack, {
      fields: [lessonTrackSubmission.trackId],
      references: [lessonTrack.id],
    }),
  }),
);

export const lesson = pgTable("lesson", {
  id: uuid("id").defaultRandom().primaryKey(),
  trackId: uuid("track_id")
    .notNull()
    .references(() => lessonTrack.id, { onDelete: "cascade" }),
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
});

export type Lesson = typeof lesson.$inferSelect;
export type CreateLessonInput = typeof lesson.$inferInsert;

export const lessonRelations = relations(lesson, ({ one, many }) => ({
  track: one(lessonTrack, {
    fields: [lesson.trackId],
    references: [lessonTrack.id],
  }),
  problem: one(problem, {
    fields: [lesson.problemId],
    references: [problem.id],
  }),
  completions: many(lessonCompletion),
}));

/**
 * Per-exercise snapshot of what a student sent, written by `submitTrack` when
 * the whole assignment is submitted — records which submission (if any) that
 * lesson's problem had at submit time, for the professor's review page.
 */
export const lessonCompletion = pgTable(
  "lesson_completion",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    submissionId: uuid("submission_id").references(() => submission.id, {
      onDelete: "set null",
    }),
    language: Language(),
    completedAt: timestamp("completed_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonId] })],
);

export type LessonCompletion = typeof lessonCompletion.$inferSelect;

export const lessonCompletionRelations = relations(
  lessonCompletion,
  ({ one }) => ({
    user: one(user, {
      fields: [lessonCompletion.userId],
      references: [user.id],
    }),
    lesson: one(lesson, {
      fields: [lessonCompletion.lessonId],
      references: [lesson.id],
    }),
    submission: one(submission, {
      fields: [lessonCompletion.submissionId],
      references: [submission.id],
    }),
  }),
);
