import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { contest } from "./contests";
import { problem } from "./problems";
import { user } from "./users";

export const activityFeed = pgTable("activity_feed", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // 'CONTEST_CREATED' | 'PROBLEM_CREATED' | 'CONTEST_COMPLETED'
  description: text("description"), // optional body
  contestId: uuid("contest_id").references(() => contest.id, {
    onDelete: "cascade",
  }),
  problemId: uuid("problem_id").references(() => problem.id, {
    onDelete: "cascade",
  }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activityFeedRelations = relations(
  activityFeed,
  ({ one, many }) => ({
    user: one(user, {
      fields: [activityFeed.userId],
      references: [user.id],
    }),
    contest: one(contest, {
      fields: [activityFeed.contestId],
      references: [contest.id],
    }),
    problem: one(problem, {
      fields: [activityFeed.problemId],
      references: [problem.id],
    }),
    likes: many(activityLike),
    comments: many(activityComment),
  }),
);

export type ActivityFeed = typeof activityFeed.$inferSelect;

export const activityLike = pgTable(
  "activity_like",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    activityId: uuid("activity_id")
      .notNull()
      .references(() => activityFeed.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    unique("activity_like_user_activity_unique").on(t.userId, t.activityId),
  ],
);

export const activityLikeRelations = relations(activityLike, ({ one }) => ({
  user: one(user, {
    fields: [activityLike.userId],
    references: [user.id],
  }),
  activity: one(activityFeed, {
    fields: [activityLike.activityId],
    references: [activityFeed.id],
  }),
}));

export type ActivityLike = typeof activityLike.$inferSelect;

export const activityComment = pgTable("activity_comment", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  activityId: uuid("activity_id")
    .notNull()
    .references(() => activityFeed.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activityCommentRelations = relations(
  activityComment,
  ({ one }) => ({
    user: one(user, {
      fields: [activityComment.userId],
      references: [user.id],
    }),
    activity: one(activityFeed, {
      fields: [activityComment.activityId],
      references: [activityFeed.id],
    }),
  }),
);

export type ActivityComment = typeof activityComment.$inferSelect;
