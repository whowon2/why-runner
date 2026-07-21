"use server";

import { db } from "@/drizzle/db";

export async function getProblemBySlug(slug: string) {
  const result = await db.query.problem.findFirst({
    where: (problems, { eq }) => eq(problems.slug, slug),
  });

  return result ?? null;
}
