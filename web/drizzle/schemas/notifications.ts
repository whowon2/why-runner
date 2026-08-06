import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { activityFeed } from "./activities";
import { contest } from "./contests";
import { lesson } from "./lessons";
import { problem } from "./problems";
import { submission } from "./submissions";
import { user } from "./users";

export const NotificationType = pgEnum("notification_type", [
  "FOLLOW",
  "ACTIVITY_LIKE",
  "ACTIVITY_COMMENT",
  "CONTEST_JOIN_REQUEST",
  "CONTEST_JOIN_APPROVED",
  "CONTEST_JOIN_REJECTED",
  "SUBMISSION_GRADED",
  "FOLLOWED_USER_PUBLISHED_PROBLEM",
  "LESSON_UNLOCKED",
]);

export type NotificationType = (typeof NotificationType.enumValues)[number];

export const notification = pgTable(
  "notification",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipientId: text("recipient_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: NotificationType().notNull(),
    count: integer("count").default(1).notNull(),
    actorIds: text("actor_ids").array().default([]).notNull(),
    read: boolean("read").default(false).notNull(),
    activityId: uuid("activity_id").references(() => activityFeed.id, {
      onDelete: "cascade",
    }),
    contestId: uuid("contest_id").references(() => contest.id, {
      onDelete: "cascade",
    }),
    submissionId: uuid("submission_id").references(() => submission.id, {
      onDelete: "cascade",
    }),
    problemId: uuid("problem_id").references(() => problem.id, {
      onDelete: "cascade",
    }),
    lessonId: uuid("lesson_id").references(() => lesson.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (t) => [
    index("notification_recipient_read_idx").on(t.recipientId, t.read),
    index("notification_activity_idx").on(t.activityId),
    index("notification_contest_idx").on(t.contestId),
    index("notification_submission_idx").on(t.submissionId),
    index("notification_problem_idx").on(t.problemId),
    index("notification_lesson_idx").on(t.lessonId),
  ],
);

export type Notification = typeof notification.$inferSelect;
export type CreateNotificationInput = typeof notification.$inferInsert;

export const notificationRelations = relations(notification, ({ one }) => ({
  recipient: one(user, {
    fields: [notification.recipientId],
    references: [user.id],
  }),
  activity: one(activityFeed, {
    fields: [notification.activityId],
    references: [activityFeed.id],
  }),
  contest: one(contest, {
    fields: [notification.contestId],
    references: [contest.id],
  }),
  submission: one(submission, {
    fields: [notification.submissionId],
    references: [submission.id],
  }),
  problem: one(problem, {
    fields: [notification.problemId],
    references: [problem.id],
  }),
  lesson: one(lesson, {
    fields: [notification.lessonId],
    references: [lesson.id],
  }),
}));

/**
 * Presence of a (userId, type) row means that notification type is disabled
 * for that user. No row means enabled — new types are on by default with no
 * backfill needed.
 */
export const notificationPreference = pgTable(
  "notification_preference",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: NotificationType().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.type] })],
);

export type NotificationPreference = typeof notificationPreference.$inferSelect;

export const notificationPreferenceRelations = relations(
  notificationPreference,
  ({ one }) => ({
    user: one(user, {
      fields: [notificationPreference.userId],
      references: [user.id],
    }),
  }),
);
