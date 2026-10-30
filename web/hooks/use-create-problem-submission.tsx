import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unwrap } from "@/lib/action-result";
import {
  type CreateProblemSubmissionInput,
  createProblemSubmission,
} from "@/lib/actions/problems/create-problem-submission";

export const useCreateProblemSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProblemSubmissionInput) => {
      return unwrap(await createProblemSubmission(input));
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["problem-submissions", variables.problemId],
      });
      queryClient.invalidateQueries({ queryKey: ["submissions", "me"] });
    },
  });
};
