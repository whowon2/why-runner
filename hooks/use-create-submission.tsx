import { useMutation } from "@tanstack/react-query";
import type { submission } from "@/drizzle/schema";
import { createSubmission } from "@/lib/actions/problems/create-submission";

type CreateSubmissionInput = typeof submission.$inferInsert;

export const useCreateSubmission = () =>
  useMutation({
    mutationFn: async (input: CreateSubmissionInput) => {
      return await createSubmission(input);
    },
  });
