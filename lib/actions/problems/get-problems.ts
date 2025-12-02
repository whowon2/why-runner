"use server";

import { db } from "@/lib/db";

export async function getProblems() {
  return await db.query.problem.findMany({});
}
