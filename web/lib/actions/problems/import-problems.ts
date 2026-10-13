"use server";

import { db } from "@/drizzle/db";
import { problem } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { generateProblemCode } from "@/lib/problem-code";
import {
  type ImportIssue,
  parseImportPayload,
} from "@/lib/problem-import/schema";
import { generateSlug } from "@/lib/slug";

export type ImportProblemsResult =
  | { ok: true; count: number }
  | { ok: false; errors: ImportIssue[] };

export async function importProblems(
  data: unknown,
): Promise<ImportProblemsResult> {
  const currentUser = await getCurrentUser({});

  const parsed = parseImportPayload(data);
  if (!parsed.ok) return parsed;

  const values = await Promise.all(
    parsed.problems.map(async (p) => ({
      ...p,
      difficulty: p.difficulty ?? null,
      narrative: p.narrative ?? null,
      slug: generateSlug(p.title),
      code: await generateProblemCode(),
      createdBy: currentUser.id,
      status: "published" as const,
    })),
  );

  await db.insert(problem).values(values);
  return { ok: true, count: values.length };
}
