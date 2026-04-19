"use server";

import { db } from "@/drizzle/db";
import { contest } from "@/drizzle/schema";
import { problemOnContest } from "@/drizzle/schemas/users";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export type CreateContestInput = Omit<typeof contest.$inferInsert, "createdBy"> & {
  problems?: string[];
};

export async function createContest(input: CreateContestInput) {
  const currentUser = await getCurrentUser({});
  const { problems, ...contestData } = input;

  const [result] = await db
    .insert(contest)
    .values({ ...contestData, createdBy: currentUser.id })
    .returning();

  if (problems && problems.length > 0) {
    const mappings = problems.map((pid) => ({
      contestId: result.id,
      problemId: pid,
    }));
    await db.insert(problemOnContest).values(mappings);
  }

  return result;
}
