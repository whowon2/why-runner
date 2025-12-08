"use server";

import { db } from "@/drizzle/db";
import { type CreateProblemInput, problem } from "@/drizzle/schema";

export async function createProblem(input: CreateProblemInput) {
  await db.insert(problem).values(input);
}
