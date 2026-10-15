import { useMutation } from "@tanstack/react-query";
import { unwrap } from "@/lib/action-result";
import { generateProblemNarrative } from "@/lib/actions/problems/generate-problem-narrative";

export const useGenerateProblemNarrative = () =>
  useMutation({
    mutationFn: async (problemId: string) => {
      return unwrap(await generateProblemNarrative(problemId));
    },
  });
