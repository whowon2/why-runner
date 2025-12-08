"use server";

import { db } from "@/drizzle/db";

export async function getProblems() {
  return await db.query.problem.findMany({});
}
