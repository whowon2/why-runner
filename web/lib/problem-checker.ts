import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { problemChecker } from "@/drizzle/schema";

/**
 * A problem's custom checker (author-only data). Callers check ownership
 * themselves; only the problem edit view may send it to the client.
 */
export async function getProblemChecker(problemId: string) {
  const found = await db.query.problemChecker.findFirst({
    where: eq(problemChecker.problemId, problemId),
    columns: { language: true, code: true },
  });
  return found ?? null;
}
