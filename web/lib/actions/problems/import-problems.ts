"use server";

import { z } from "zod";
import { db } from "@/drizzle/db";
import { problem } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { generateProblemCode } from "@/lib/problem-code";
import { generateSlug } from "@/lib/slug";

const importSchema = z.array(
  z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    difficulty: z.enum(["easy", "medium", "hard"]).nullable().optional(),
    exampleCount: z.number().int().min(1).default(1),
    inputs: z.array(z.string()).min(1),
    outputs: z.array(z.string()).min(1),
  }),
);

export async function importProblems(data: unknown): Promise<number> {
  const currentUser = await getCurrentUser({});

  const parsed = importSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error(
      `Invalid format: ${parsed.error.issues[0]?.message ?? "unknown error"}`,
    );
  }

  if (parsed.data.length === 0) {
    throw new Error("File contains no problems");
  }

  const values = await Promise.all(
    parsed.data.map(async (p) => ({
      ...p,
      difficulty: p.difficulty ?? null,
      slug: generateSlug(p.title),
      code: await generateProblemCode(),
      createdBy: currentUser.id,
      status: "published" as const,
    })),
  );

  await db.insert(problem).values(values);
  return values.length;
}
