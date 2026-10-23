import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { contest } from "./contests";
import { lesson } from "./lessons";
import { user } from "./users";

export const SURVEY_FORMS = [
  "contest_author",
  "contest_participant",
  "lesson_author",
  "lesson_student",
] as const;

export type SurveyFormKey = (typeof SURVEY_FORMS)[number];

export const SurveyForm = pgEnum("survey_form", SURVEY_FORMS);

/**
 * One answered evaluation questionnaire (TCC classroom evaluation). Contest
 * forms set `contestId`, lesson forms set `lessonId`. Both FKs are
 * `set null` and `entityName` snapshots the name, so research data survives
 * the contest/lesson being deleted later.
 */
export const surveyResponse = pgTable(
  "survey_response",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    form: SurveyForm("form").notNull(),
    formVersion: integer("form_version").notNull(),
    contestId: uuid("contest_id").references(() => contest.id, {
      onDelete: "set null",
    }),
    lessonId: uuid("lesson_id").references(() => lesson.id, {
      onDelete: "set null",
    }),
    entityName: text("entity_name").notNull(),
    answers: jsonb("answers").$type<Record<string, unknown>>().notNull(),
    susScore: real("sus_score").notNull(),
    consentedAt: timestamp("consented_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("survey_response_user_form_contest_unique")
      .on(t.userId, t.form, t.contestId)
      .where(sql`${t.contestId} IS NOT NULL`),
    uniqueIndex("survey_response_user_form_lesson_unique")
      .on(t.userId, t.form, t.lessonId)
      .where(sql`${t.lessonId} IS NOT NULL`),
    index("survey_response_form_idx").on(t.form),
    check(
      "survey_response_entity_matches_form",
      sql`(${t.form} IN ('contest_author', 'contest_participant') AND ${t.lessonId} IS NULL)
        OR (${t.form} IN ('lesson_author', 'lesson_student') AND ${t.contestId} IS NULL)`,
    ),
  ],
);

export type SurveyResponse = typeof surveyResponse.$inferSelect;

export const surveyResponseRelations = relations(surveyResponse, ({ one }) => ({
  user: one(user, {
    fields: [surveyResponse.userId],
    references: [user.id],
  }),
  contest: one(contest, {
    fields: [surveyResponse.contestId],
    references: [contest.id],
  }),
  lesson: one(lesson, {
    fields: [surveyResponse.lessonId],
    references: [lesson.id],
  }),
}));
