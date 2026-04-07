"use server";

import { db } from "@/drizzle/db";
import { contest } from "@/drizzle/schema";
import { problemOnContest } from "@/drizzle/schemas/users";

export type CreateContestInput = typeof contest.$inferInsert & {
  problems?: string[];
};

export async function createContest(input: CreateContestInput) {
  const { problems, ...contestData } = input;

  const [result] = await db.insert(contest).values(contestData).returning();

  if (problems && problems.length > 0) {
    const mappings = problems.map((pid) => ({
      contestId: result.id,
      problemId: pid,
    }));
    await db.insert(problemOnContest).values(mappings);
  }

  return result;
}
