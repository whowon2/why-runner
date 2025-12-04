import { useMutation } from "@tanstack/react-query";
import { getAIHelp } from "@/lib/actions/get-ai-help";
import type { Problem, Submission } from "@/lib/db/schema";

type CreateContestInput = {
  problem: Problem;
  submission: Submission;
  locale: string;
};

export const useAIHelp = () =>
  useMutation({
    mutationFn: async (input: CreateContestInput) => {
      return await getAIHelp(input.problem, input.submission, input.locale);
    },
  });
