"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { problem } from "@/drizzle/schema";
import { type ActionResult, ok } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { ownerOrAdminFilter } from "@/lib/auth/permissions";
import { getNarrativePrompt, SYSTEM_INSTRUCTION_NARRATIVE } from "@/lib/prompt";
import { generateText } from "@/lib/ai";
import { consumeAiQuota } from "@/lib/rate-limit";

export async function generateProblemNarrative(
  problemId: string,
): Promise<ActionResult<string, "RATE_LIMITED">> {
  const currentUser = await getCurrentUser({});
  // Creator or admin.
  const ownerFilter = await ownerOrAdminFilter(
    problem.createdBy,
    currentUser.id,
  );

  const found = await db.query.problem.findFirst({
    where: and(eq(problem.id, problemId), ownerFilter),
  });

  if (!found) throw new Error("Problem not found.");

  if (!found.description.trim()) {
    throw new Error("A description is required to generate a narrative.");
  }

  const quota = await consumeAiQuota(currentUser.id, "narrative");
  if (!quota.ok) return quota;

  const narrative = await generateText("narrative", {
    system: SYSTEM_INSTRUCTION_NARRATIVE,
    prompt: getNarrativePrompt({ problem: found }),
  });

  return ok(narrative.trim());
}
