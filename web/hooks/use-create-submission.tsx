import { useMutation } from "@tanstack/react-query";
import { unwrap } from "@/lib/action-result";
import {
  type CreateContestSubmissionInput,
  createSubmission,
} from "@/lib/actions/problems/create-submission";

export const useCreateSubmission = () =>
  useMutation({
    mutationFn: async (input: CreateContestSubmissionInput) => {
      return unwrap(await createSubmission(input));
    },
  });
