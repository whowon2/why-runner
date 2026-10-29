import "server-only";

import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { user } from "@/drizzle/schema";

export type IdentityErrorCode =
  | "USERNAME_INVALID"
  | "USERNAME_TAKEN"
  | "RA_INVALID"
  | "RA_TAKEN";

/** Case-insensitive, like the `user_username_lower_idx` unique index. */
export async function isUsernameTaken(username: string, exceptUserId?: string) {
  const found = await db.query.user.findFirst({
    where: and(
      sql`lower(${user.username}) = lower(${username})`,
      exceptUserId ? ne(user.id, exceptUserId) : undefined,
    ),
    columns: { id: true },
  });
  return !!found;
}

export async function isRaTaken(ra: string, exceptUserId?: string) {
  const found = await db.query.user.findFirst({
    where: and(
      eq(user.ra, ra),
      exceptUserId ? ne(user.id, exceptUserId) : undefined,
    ),
    columns: { id: true },
  });
  return !!found;
}

/**
 * Unique violation that slipped past the checks above (concurrent writes).
 * Drizzle wraps the pg error, so look at `cause` too.
 */
export function identityConflictFromPgError(
  err: unknown,
): IdentityErrorCode | null {
  for (
    let e = err;
    e && typeof e === "object";
    e = (e as { cause?: unknown }).cause
  ) {
    const { code, constraint } = e as { code?: string; constraint?: string };
    if (code !== "23505") continue;
    if (constraint === "user_username_lower_idx") return "USERNAME_TAKEN";
    if (constraint === "user_ra_unique") return "RA_TAKEN";
  }
  return null;
}
