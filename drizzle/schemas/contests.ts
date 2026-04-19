import { relations } from "drizzle-orm";
import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { problemOnContest, userOnContest } from "./users";

export const contest = pgTable("contest", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isPrivate: boolean("is_private").default(false).notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Contest = typeof contest.$inferSelect;

export const contestRelations = relations(contest, ({ many }) => ({
  users: many(userOnContest),
  problems: many(problemOnContest),
}));
