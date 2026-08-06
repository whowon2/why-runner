"use server";

import { GoogleGenAI } from "@google/genai";
import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { type Language, problem } from "@/drizzle/schema";
import { env } from "@/env";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getReferenceSolutionPrompt,
  SYSTEM_INSTRUCTION_REFERENCE_SOLUTION,
} from "@/lib/prompt";

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
) {
  const currentUser = await getCurrentUser({});

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

  const ai = new GoogleGenAI({ apiKey: env.GEMINI_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: { systemInstruction: SYSTEM_INSTRUCTION_REFERENCE_SOLUTION },
    contents: getReferenceSolutionPrompt({ problem: found, language }),
  });

  return stripCodeFence(response.text ?? "");
}
