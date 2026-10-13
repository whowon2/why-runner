"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { problem } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getNarrativePrompt, SYSTEM_INSTRUCTION_NARRATIVE } from "@/lib/prompt";
import { generateText } from "@/lib/ai";

export async function generateProblemNarrative(
  problemId: string,
): Promise<string> {
  const currentUser = await getCurrentUser({});

  const found = await db.query.problem.findFirst({
    where: and(
      eq(problem.id, problemId),
      eq(problem.createdBy, currentUser.id),
    ),
  });

  if (!found) throw new Error("Problem not found.");

  if (!found.description.trim()) {
    throw new Error("A description is required to generate a narrative.");
  }

  const narrative = await generateText("narrative", {
    system: SYSTEM_INSTRUCTION_NARRATIVE,
    prompt: getNarrativePrompt({ problem: found }),
  });

  return narrative.trim();
}
