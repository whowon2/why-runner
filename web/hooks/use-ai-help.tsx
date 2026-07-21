import { useMutation } from "@tanstack/react-query";
import type { ProblemPreview, Submission } from "@/drizzle/schema";
import { getAIHelp } from "@/lib/actions/get-ai-help";

type CreateContestInput = {
  problem: ProblemPreview;
  submission: Submission;
  locale: string;
};

export const useAIHelp = () =>
  useMutation({
    mutationFn: async (input: CreateContestInput) => {
      return await getAIHelp(input.problem, input.submission, input.locale);
    },
  });
