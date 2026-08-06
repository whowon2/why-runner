import { useMutation } from "@tanstack/react-query";
import type { Language } from "@/drizzle/schema";
import { generateReferenceSolution } from "@/lib/actions/problems/generate-reference-solution";

type GenerateReferenceSolutionInput = {
  problemId: string;
  language: Language;
};

export const useGenerateReferenceSolution = () =>
  useMutation({
    mutationFn: async (input: GenerateReferenceSolutionInput) => {
      return await generateReferenceSolution(input.problemId, input.language);
    },
  });
