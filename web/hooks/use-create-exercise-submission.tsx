import { useMutation } from "@tanstack/react-query";
import type { Language } from "@/drizzle/schema";
import { createExerciseSubmission } from "@/lib/actions/lessons/create-exercise-submission";

export const useCreateExerciseSubmission = () =>
  useMutation({
    mutationFn: async (input: {
      exerciseId: string;
      code: string;
      language: Language;
    }) => {
      return await createExerciseSubmission(input);
    },
  });
