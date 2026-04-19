"use server";

import { GoogleGenAI } from "@google/genai";
import type { ProblemPreview, Submission } from "@/drizzle/schema";
import { env } from "@/env";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { SYSTEM_INSTRUCTION, getUserPrompt } from "../prompt";

export async function getAIHelp(
  problem: ProblemPreview,
  submission: Submission,
  locale: string,
) {
  await getCurrentUser({});

  const ai = new GoogleGenAI({ apiKey: env.GEMINI_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    config: { systemInstruction: SYSTEM_INSTRUCTION },
    contents: getUserPrompt({ problem, submission, locale }),
  });

  return response.text;
}
