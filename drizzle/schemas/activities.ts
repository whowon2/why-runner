import { relations } from "drizzle-orm";
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
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

export const activityFeedRelations = relations(activityFeed, ({ one }) => ({
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
}));

export type ActivityFeed = typeof activityFeed.$inferSelect;
