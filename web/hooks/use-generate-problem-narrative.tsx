import { useMutation } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { unwrap } from "@/lib/action-result";
import { generateProblemNarrative } from "@/lib/actions/problems/generate-problem-narrative";

export const useGenerateProblemNarrative = () => {
  const locale = useLocale();
  return useMutation({
    mutationFn: async (problemId: string) => {
      return unwrap(await generateProblemNarrative(problemId, locale));
    },
  });
};
