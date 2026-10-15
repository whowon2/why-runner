"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { type Language, problem } from "@/drizzle/schema";
import { type ActionResult, ok } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getReferenceSolutionPrompt,
  SYSTEM_INSTRUCTION_REFERENCE_SOLUTION,
} from "@/lib/prompt";
import { generateText } from "@/lib/ai";
import { consumeAiQuota } from "@/lib/rate-limit";
import { languageSchema } from "@/lib/submission-limits";

// Strips a single leading/trailing markdown code fence, in case the model
// adds one despite being told not to. Defensive only — the prompt asks for
// raw code.
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^```[^\n]*\n([\s\S]*?)\n?```$/);
  return match ? match[1] : trimmed;
}

export async function generateReferenceSolution(
  problemId: string,
  language: Language,
): Promise<ActionResult<string, "RATE_LIMITED">> {
  const currentUser = await getCurrentUser({});
  languageSchema.parse(language);

  const found = await db.query.problem.findFirst({
    where: and(
      eq(problem.id, problemId),
      eq(problem.createdBy, currentUser.id),
    ),
  });

  if (!found) throw new Error("Problem not found.");

  if (!found.description.trim()) {
    throw new Error(
      "A description is required to generate a reference solution.",
    );
  }

  if (
    found.inputs.length === 0 ||
    found.inputs.length !== found.outputs.length
  ) {
    throw new Error(
      "At least one test case is required to generate a reference solution.",
    );
  }

  const quota = await consumeAiQuota(currentUser.id, "reference-solution");
  if (!quota.ok) return quota;

  const text = await generateText("reference-solution", {
    system: SYSTEM_INSTRUCTION_REFERENCE_SOLUTION,
    prompt: getReferenceSolutionPrompt({ problem: found, language }),
  });

  return ok(stripCodeFence(text));
}
