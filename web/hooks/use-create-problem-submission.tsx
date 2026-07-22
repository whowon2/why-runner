import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Language } from "@/drizzle/schema";
import { createProblemSubmission } from "@/lib/actions/problems/create-problem-submission";

type CreateProblemSubmissionInput = {
  code: string;
  language: Language;
  problemId: string;
};

export const useCreateProblemSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProblemSubmissionInput) => {
      return await createProblemSubmission(input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["problem-submissions", variables.problemId],
      });
    },
  });
};
