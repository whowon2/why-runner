"use server";

import { db } from "@/drizzle/db";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function getUserSubmissions() {
  const currentUser = await getCurrentUser({});

  return db.query.submission.findMany({
    where: (submissions, { eq }) => eq(submissions.userId, currentUser.id),
    with: {
      user: true,
      problem: { columns: { inputs: false, outputs: false } },
    },
  });
}
