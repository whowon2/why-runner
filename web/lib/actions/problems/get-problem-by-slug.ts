"use server";

import { db } from "@/drizzle/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function getProblemBySlug(slug: string) {
  const currentUser = await getCurrentUser({});

  const result = await db.query.problem.findFirst({
    where: (problems, { and, eq, or }) =>
      and(
        eq(problems.slug, slug),
        or(
          eq(problems.status, "published"),
          eq(problems.createdBy, currentUser.id),
        ),
      ),
  });

  return result ?? null;
}
