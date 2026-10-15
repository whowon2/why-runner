import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { user } from "./users";

/**
 * One row per LLM call made on a user's behalf; `lib/rate-limit.ts` counts
 * rows in a sliding window to cap AI cost per user. Pruned opportunistically.
 */
export const aiUsage = pgTable(
  "ai_usage",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    feature: text("feature").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (t) => [
    index("ai_usage_user_feature_created_idx").on(
      t.userId,
      t.feature,
      t.createdAt,
    ),
  ],
);
