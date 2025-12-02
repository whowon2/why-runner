"use server";

import type { AddProblemToContestInput } from "@/hooks/use-add-problem";
import { db } from "@/lib/db";
import { problemOnContest } from "@/lib/db/schema";

export async function addProblemToContest(input: AddProblemToContestInput) {
  await db.insert(problemOnContest).values(input);
}
