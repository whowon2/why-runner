"use server";

import { GoogleGenAI } from "@google/genai";
import { env } from "@/env";
import type { Problem, Submission } from "../db/schema";
import { getPrompt } from "../prompt";

export async function getAIHelp(
  problem: Problem,
  submission: Submission,
  locale: string,
) {
  const prompt = getPrompt({ problem, submission, locale });

  const ai = new GoogleGenAI({ apiKey: env.GEMINI_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });

  return response.text;
}
