import { useMutation } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { unwrap } from "@/lib/action-result";
import type { Language } from "@/drizzle/schema";
import { generateReferenceSolution } from "@/lib/actions/problems/generate-reference-solution";

type GenerateReferenceSolutionInput = {
  problemId: string;
  language: Language;
};

export const useGenerateReferenceSolution = () => {
  const locale = useLocale();
  return useMutation({
    mutationFn: async (input: GenerateReferenceSolutionInput) => {
      return unwrap(
        await generateReferenceSolution(
          input.problemId,
          input.language,
          locale,
        ),
      );
    },
  });
};
