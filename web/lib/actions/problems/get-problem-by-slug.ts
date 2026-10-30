"use server";

import { db } from "@/drizzle/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { isAdmin } from "@/lib/auth/permissions";

export async function getProblemBySlug(slug: string) {
  const currentUser = await getCurrentUser({});
  // Admins see every draft too.
  const admin = await isAdmin(currentUser.id);

  const result = await db.query.problem.findFirst({
    where: (problems, { and, eq, or }) =>
      and(
        eq(problems.slug, slug),
        admin
          ? undefined
          : or(
              eq(problems.status, "published"),
              eq(problems.createdBy, currentUser.id),
            ),
      ),
  });

  return result ?? null;
}
