import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unwrap } from "@/lib/action-result";
import {
  type CreateContestSubmissionInput,
  createSubmission,
} from "@/lib/actions/problems/create-submission";

export const useCreateSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateContestSubmissionInput) => {
      return unwrap(await createSubmission(input));
    },
    onSuccess: (_data, variables) => {
      // Problem-scoped list (editor verdict, submission list), the contest's
      // live view and the user's own history.
      queryClient.invalidateQueries({
        queryKey: ["submissions", String(variables.problemId)],
      });
      queryClient.invalidateQueries({
        queryKey: ["submissions", { contestId: variables.contestId }],
      });
      queryClient.invalidateQueries({ queryKey: ["submissions", "me"] });
    },
  });
};
