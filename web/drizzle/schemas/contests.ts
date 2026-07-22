import { relations } from "drizzle-orm";
import {
  boolean,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { problemOnContest, userOnContest } from "./users";

export const ContestStatus = pgEnum("contest_status", ["draft", "published"]);

export const contest = pgTable("contest", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").default("Untitled Contest").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").default("").notNull(),
  status: ContestStatus().default("draft").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isPrivate: boolean("is_private").default(false).notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Contest = typeof contest.$inferSelect;

export const contestRelations = relations(contest, ({ many }) => ({
  users: many(userOnContest),
  problems: many(problemOnContest),
}));
