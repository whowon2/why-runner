import "server-only";

import { and, count, eq, gte, lt, min } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { aiUsage } from "@/drizzle/schema";
import { type ActionResult, fail, ok } from "@/lib/action-result";

const TEN_MINUTES = 10 * 60;

/** Max calls per user within `windowSecs`, per AI feature. */
const AI_LIMITS = {
  "ai-help": { max: 10, windowSecs: TEN_MINUTES },
  "problem-review": { max: 10, windowSecs: TEN_MINUTES },
  narrative: { max: 10, windowSecs: TEN_MINUTES },
  "tag-suggestion": { max: 20, windowSecs: TEN_MINUTES },
  "reference-solution": { max: 10, windowSecs: TEN_MINUTES },
} as const;

export type AiFeature = keyof typeof AI_LIMITS;

/**
 * Records one AI call for the user, or refuses with `RATE_LIMITED` (params:
 * `seconds` until the oldest call in the window expires). Count-then-insert
 * isn't atomic, so a burst can slightly exceed the limit — this is a cost
 * guard, not a security boundary.
 */
export async function consumeAiQuota(
  userId: string,
  feature: AiFeature,
): Promise<ActionResult<void, "RATE_LIMITED">> {
  const { max, windowSecs } = AI_LIMITS[feature];
  const now = Date.now();
  const windowStart = new Date(now - windowSecs * 1000);

  const [{ used, oldest }] = await db
    .select({ used: count(), oldest: min(aiUsage.createdAt) })
    .from(aiUsage)
    .where(
      and(
        eq(aiUsage.userId, userId),
        eq(aiUsage.feature, feature),
        gte(aiUsage.createdAt, windowStart),
      ),
    );

  if (used >= max) {
    const freesAt = (oldest?.getTime() ?? now) + windowSecs * 1000;
    return fail("RATE_LIMITED", {
      seconds: Math.max(1, Math.ceil((freesAt - now) / 1000)),
    });
  }

  await db.insert(aiUsage).values({ userId, feature });

  // Opportunistic cleanup instead of a cron: ~1% of calls drop old rows.
  if (Math.random() < 0.01) {
    await db
      .delete(aiUsage)
      .where(lt(aiUsage.createdAt, new Date(now - 24 * 60 * 60 * 1000)));
  }

  return ok(undefined);
}
