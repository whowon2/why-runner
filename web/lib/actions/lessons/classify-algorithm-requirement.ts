"use server";

import { z } from "zod";
import { generateJson } from "@/lib/ai";
import {
  SYSTEM_INSTRUCTION_ALGORITHM_CLASSIFICATION,
  getAlgorithmClassificationPrompt,
} from "@/lib/prompt";

const ClassificationSchema = z.object({
  satisfied: z.boolean(),
  rationale: z.string(),
});

export type AlgorithmClassification = z.infer<typeof ClassificationSchema>;

// Not user-invoked directly (no auth check here by design) — only ever
// called server-side from `resolvePendingConstraintClassifications`, which
// already scopes to submissions tied to a constrained lesson.
export async function classifyAlgorithmRequirement(input: {
  requirement: string;
  code: string;
  language: string;
}): Promise<AlgorithmClassification> {
  return generateJson("algorithm-classification", {
    system: SYSTEM_INSTRUCTION_ALGORITHM_CLASSIFICATION,
    prompt: getAlgorithmClassificationPrompt(input),
    schema: ClassificationSchema,
  });
}
