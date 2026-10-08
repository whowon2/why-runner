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

// Ordered least → most revealing; the contest value is the maximum level a
// participant can reach on the AI hint ladder.
export const ContestAiAssistance = pgEnum("contest_ai_assistance", [
  "off",
  "concept",
  "hint",
  "pinpoint",
]);

export const AI_ASSISTANCE_LEVELS = ContestAiAssistance.enumValues;
export type AiAssistance = (typeof AI_ASSISTANCE_LEVELS)[number];

export const contest = pgTable("contest", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").default("Untitled Contest").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").default("").notNull(),
  status: ContestStatus().default("draft").notNull(),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  isPrivate: boolean("is_private").default(false).notNull(),
  aiAssistance: ContestAiAssistance("ai_assistance").default("off").notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Contest = typeof contest.$inferSelect;

export const contestRelations = relations(contest, ({ many }) => ({
  users: many(userOnContest),
  problems: many(problemOnContest),
}));
