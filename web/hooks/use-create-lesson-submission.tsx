import { useMutation } from "@tanstack/react-query";
import type { Language } from "@/drizzle/schema";
import { createLessonSubmission } from "@/lib/actions/lessons/create-lesson-submission";

export const useCreateLessonSubmission = () =>
  useMutation({
    mutationFn: async (input: {
      problemId: string;
      code: string;
      language: Language;
    }) => {
      return await createLessonSubmission(input);
    },
  });
