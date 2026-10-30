"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import { codeRun } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

/** One of the current user's own runs: result columns only. */
export async function getRun(rawId: string) {
  const currentUser = await getCurrentUser({});
  const id = z.uuid().parse(rawId);

  const run = await db.query.codeRun.findFirst({
    where: and(eq(codeRun.id, id), eq(codeRun.userId, currentUser.id)),
    columns: {
      id: true,
      status: true,
      language: true,
      stdout: true,
      stderr: true,
      stdoutTruncated: true,
      stderrTruncated: true,
      exitCode: true,
      runtimeMs: true,
      memoryKb: true,
      createdAt: true,
    },
  });
  if (!run) throw new Error("Run not found.");
  return run;
}

export type RunResult = Awaited<ReturnType<typeof getRun>>;
