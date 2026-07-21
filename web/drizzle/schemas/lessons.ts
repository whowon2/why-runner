import { relations } from "drizzle-orm";
import {
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { Language } from "./submissions";
import { problem } from "./problems";
import { user } from "./users";

export const LessonTheme = pgEnum("lesson_theme", [
  "strings",
  "arrays",
  "loops",
  "conditionals",
]);

export type LessonTheme = (typeof LessonTheme.enumValues)[number];

export const lesson = pgTable("lesson", {
  id: uuid("id").defaultRandom().primaryKey(),
  problemId: uuid("problem_id")
    .notNull()
    .references(() => problem.id, { onDelete: "cascade" })
    .unique(),
  theme: LessonTheme().notNull(),
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
  problem: one(problem, {
    fields: [lesson.problemId],
    references: [problem.id],
  }),
  completions: many(lessonCompletion),
}));

export const lessonCompletion = pgTable(
  "lesson_completion",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: uuid("lesson_id")
      .notNull()
      .references(() => lesson.id, { onDelete: "cascade" }),
    language: Language().notNull(),
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
  }),
);

export const userThemeSkill = pgTable(
  "user_theme_skill",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    theme: LessonTheme().notNull(),
    value: integer("value").default(0).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.theme] })],
);

export type UserThemeSkill = typeof userThemeSkill.$inferSelect;

export const userThemeSkillRelations = relations(userThemeSkill, ({ one }) => ({
  user: one(user, {
    fields: [userThemeSkill.userId],
    references: [user.id],
  }),
}));

export const userLanguageSkill = pgTable(
  "user_language_skill",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    language: Language().notNull(),
    value: integer("value").default(0).notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.language] })],
);

export type UserLanguageSkill = typeof userLanguageSkill.$inferSelect;

export const userLanguageSkillRelations = relations(
  userLanguageSkill,
  ({ one }) => ({
    user: one(user, {
      fields: [userLanguageSkill.userId],
      references: [user.id],
    }),
  }),
);
