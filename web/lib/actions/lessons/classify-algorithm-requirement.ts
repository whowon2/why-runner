"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { env } from "@/env";
import {
  SYSTEM_INSTRUCTION_ALGORITHM_CLASSIFICATION,
  getAlgorithmClassificationPrompt,
} from "@/lib/prompt";

export type AlgorithmClassification = {
  satisfied: boolean;
  rationale: string;
};

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    satisfied: { type: Type.BOOLEAN },
    rationale: { type: Type.STRING },
  },
  required: ["satisfied", "rationale"],
};

// Not user-invoked directly (no auth check here by design) — only ever
// called server-side from `resolvePendingConstraintClassifications`, which
// already scopes to submissions tied to a constrained lesson.
export async function classifyAlgorithmRequirement(input: {
  requirement: string;
  code: string;
  language: string;
}): Promise<AlgorithmClassification> {
  const ai = new GoogleGenAI({ apiKey: env.GEMINI_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_ALGORITHM_CLASSIFICATION,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
    contents: getAlgorithmClassificationPrompt(input),
  });

  try {
    const parsed = JSON.parse(response.text ?? "{}");
    return {
      satisfied: Boolean(parsed.satisfied),
      rationale:
        typeof parsed.rationale === "string"
          ? parsed.rationale
          : "No rationale returned.",
    };
  } catch {
    throw new Error("The AI classification could not be parsed.");
  }
}
