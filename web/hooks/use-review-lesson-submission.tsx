import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewLessonSubmission } from "@/lib/actions/lessons/review-lesson-submission";

export const useReviewLessonSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      lessonId: string;
      userId: string;
      score: number;
    }) => {
      return await reviewLessonSubmission(input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["lessons", variables.lessonId, "review"],
      });
    },
  });
};
