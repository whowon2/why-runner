import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  markLessonSubmissionReviewed,
  setExerciseFeedback,
} from "@/lib/actions/lessons/review-lesson-submission";

export const useMarkLessonSubmissionReviewed = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { lessonId: string; userId: string }) => {
      return await markLessonSubmissionReviewed(input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["lessons", variables.lessonId, "review"],
      });
    },
  });
};

export const useSetExerciseFeedback = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      lessonId: string;
      exerciseId: string;
      userId: string;
      feedback: string;
    }) => {
      return await setExerciseFeedback(input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["lessons", variables.lessonId, "review"],
      });
    },
  });
};
