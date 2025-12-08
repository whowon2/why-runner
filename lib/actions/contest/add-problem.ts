"use server";

import { db } from "@/drizzle/db";
import { problemOnContest } from "@/drizzle/schema";
import type { AddProblemToContestInput } from "@/hooks/use-add-problem";

export async function addProblemToContest(input: AddProblemToContestInput) {
  await db.insert(problemOnContest).values(input);
}
