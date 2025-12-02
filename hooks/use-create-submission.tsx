import { useMutation } from "@tanstack/react-query";
import { createSubmission } from "@/lib/actions/problems/create-submission";
import type { submission } from "@/lib/db/schema";

type CreateSubmissionInput = typeof submission.$inferInsert;

export const useCreateSubmission = () =>
  useMutation({
    mutationFn: async (input: CreateSubmissionInput) => {
      return await createSubmission(input);
    },
  });
