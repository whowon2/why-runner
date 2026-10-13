"use server";

import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import { PROBLEM_TAGS, type ProblemTag, problem } from "@/drizzle/schema";
import { generateJson } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  getTagSuggestionPrompt,
  SYSTEM_INSTRUCTION_TAG_SUGGESTION,
} from "@/lib/prompt";

const MAX_TAGS = 5;
// Bounds token cost — the action takes unsaved form text, not the stored row.
const MAX_TITLE_LENGTH = 500;
const MAX_DESCRIPTION_LENGTH = 20_000;

// The enum constrains the model's output to the taxonomy; a response with an
// unknown key fails validation and moves on to the next AI provider.
const SuggestionSchema = z.object({ tags: z.array(z.enum(PROBLEM_TAGS)) });

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

  const { tags } = await generateJson("tag-suggestion", {
    system: SYSTEM_INSTRUCTION_TAG_SUGGESTION,
    prompt: getTagSuggestionPrompt({
      title: title.slice(0, MAX_TITLE_LENGTH),
      description: description.slice(0, MAX_DESCRIPTION_LENGTH),
      allowedTags: PROBLEM_TAGS,
    }),
    schema: SuggestionSchema,
  });

  return [...new Set(tags)].slice(0, MAX_TAGS);
}
