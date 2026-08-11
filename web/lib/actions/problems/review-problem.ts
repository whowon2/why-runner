"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { problem } from "@/drizzle/schema";
import { env } from "@/env";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getProblemReviewPrompt,
  SYSTEM_INSTRUCTION_PROBLEM_REVIEW,
} from "@/lib/prompt";

export type ProblemReviewEdgeCase = {
  input: string;
  output: string;
  rationale: string;
};

export type ProblemReview = {
  descriptionFeedback: string;
  edgeCases: ProblemReviewEdgeCase[];
};

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    descriptionFeedback: { type: Type.STRING },
    edgeCases: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          input: { type: Type.STRING },
          output: { type: Type.STRING },
          rationale: { type: Type.STRING },
        },
        required: ["input", "output", "rationale"],
      },
    },
  },
  required: ["descriptionFeedback", "edgeCases"],
};

export async function reviewProblem(problemId: string): Promise<ProblemReview> {
  const currentUser = await getCurrentUser({});

  const found = await db.query.problem.findFirst({
    where: and(
      eq(problem.id, problemId),
      eq(problem.createdBy, currentUser.id),
    ),
  });

  if (!found) throw new Error("Problem not found.");

  const ai = new GoogleGenAI({ apiKey: env.GEMINI_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_PROBLEM_REVIEW,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
    contents: getProblemReviewPrompt({ problem: found }),
  });

  try {
    const parsed = JSON.parse(response.text ?? "{}");
    return {
      descriptionFeedback:
        typeof parsed.descriptionFeedback === "string"
          ? parsed.descriptionFeedback
          : "",
      edgeCases: Array.isArray(parsed.edgeCases) ? parsed.edgeCases : [],
    };
  } catch {
    throw new Error("The AI review could not be parsed. Please try again.");
  }
}
