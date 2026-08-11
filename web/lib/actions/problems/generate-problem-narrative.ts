"use server";

import { GoogleGenAI } from "@google/genai";
import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { problem } from "@/drizzle/schema";
import { env } from "@/env";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { getNarrativePrompt, SYSTEM_INSTRUCTION_NARRATIVE } from "@/lib/prompt";

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

  const ai = new GoogleGenAI({ apiKey: env.GEMINI_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: { systemInstruction: SYSTEM_INSTRUCTION_NARRATIVE },
    contents: getNarrativePrompt({ problem: found }),
  });

  return (response.text ?? "").trim();
}
