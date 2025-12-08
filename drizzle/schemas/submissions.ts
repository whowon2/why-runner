import { relations } from "drizzle-orm";
import { pgEnum, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { problem } from "./problems";
import { user } from "./users";

export const Language = pgEnum("language", [
  "c",
  "cpp",
  "java",
  "python",
  "rust",
]);

export type Language = (typeof Language.enumValues)[number];

export const SubmissionStatus = pgEnum("submission_status", [
  "PENDING",
  "PASSED",
  "FAILED",
  "ERROR",
  "RUNNING",
]);

export const submission = pgTable("submission", {
  id: serial("id").primaryKey(),
  status: SubmissionStatus().default("PENDING").notNull(),
  code: text("code").notNull(),
  language: Language(),
  questionLetter: text("question_letter").notNull(),
  output: text("output"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
  problemId: serial("problem_id")
    .notNull()
    .references(() => problem.id, { onDelete: "cascade" }),
  contestId: serial("contest_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export type Submission = typeof submission.$inferSelect;

export const submissionRelations = relations(submission, ({ one }) => ({
  user: one(user, {
    fields: [submission.userId],
    references: [user.id],
  }),
  problem: one(problem, {
    fields: [submission.problemId],
    references: [problem.id],
  }),
}));

export type CreateSubmissionInput = typeof submission.$inferInsert;
