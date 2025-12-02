"use server";

import { db } from "@/lib/db";
import { type CreateProblemInput, problem } from "@/lib/db/schema";

export async function createProblem(input: CreateProblemInput) {
  await db.insert(problem).values(input);
}
