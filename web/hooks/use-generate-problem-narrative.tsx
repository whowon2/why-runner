import { useMutation } from "@tanstack/react-query";
import { generateProblemNarrative } from "@/lib/actions/problems/generate-problem-narrative";

export const useGenerateProblemNarrative = () =>
  useMutation({
    mutationFn: async (problemId: string) => {
      return await generateProblemNarrative(problemId);
    },
  });
