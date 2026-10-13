"use server";

import { GoogleGenAI, Type } from "@google/genai";
import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { PROBLEM_TAGS, type ProblemTag, problem } from "@/drizzle/schema";
import { env } from "@/env";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { GEMINI_MODEL } from "@/lib/gemini-model";
import {
  getTagSuggestionPrompt,
  SYSTEM_INSTRUCTION_TAG_SUGGESTION,
} from "@/lib/prompt";

const MAX_TAGS = 5;
// Bounds token cost — the action takes unsaved form text, not the stored row.
const MAX_TITLE_LENGTH = 500;
const MAX_DESCRIPTION_LENGTH = 20_000;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    tags: {
      type: Type.ARRAY,
      items: { type: Type.STRING, enum: [...PROBLEM_TAGS] },
    },
  },
  required: ["tags"],
};

export type SuggestProblemTagsInput = {
  problemId: string;
  title: string;
  description: string;
};

export async function suggestProblemTags({
  problemId,
  title,
  description,
}: SuggestProblemTagsInput): Promise<ProblemTag[]> {
  const currentUser = await getCurrentUser({});

  const found = await db.query.problem.findFirst({
    where: and(
      eq(problem.id, problemId),
      eq(problem.createdBy, currentUser.id),
    ),
    columns: { id: true },
  });

  if (!found) throw new Error("Problem not found.");

  if (!description.trim()) {
    throw new Error("A description is required to suggest tags.");
  }

  const ai = new GoogleGenAI({ apiKey: env.GEMINI_KEY });

  const response = await ai.models.generateContent({
    model: GEMINI_MODEL,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION_TAG_SUGGESTION,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
    contents: getTagSuggestionPrompt({
      title: title.slice(0, MAX_TITLE_LENGTH),
      description: description.slice(0, MAX_DESCRIPTION_LENGTH),
      allowedTags: PROBLEM_TAGS,
    }),
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(response.text ?? "{}");
  } catch {
    throw new Error(
      "The AI tag suggestion could not be parsed. Please try again.",
    );
  }

  const raw =
    parsed && typeof parsed === "object" && "tags" in parsed
      ? (parsed as { tags: unknown }).tags
      : [];
  if (!Array.isArray(raw)) return [];

  const valid = raw.filter((tag): tag is ProblemTag =>
    PROBLEM_TAGS.includes(tag as ProblemTag),
  );

  return [...new Set(valid)].slice(0, MAX_TAGS);
}
