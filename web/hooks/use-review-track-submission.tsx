import { useMutation, useQueryClient } from "@tanstack/react-query";
import { reviewTrackSubmission } from "@/lib/actions/lessons/review-track-submission";

export const useReviewTrackSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      trackId: string;
      userId: string;
      score: number;
    }) => {
      return await reviewTrackSubmission(input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tracks", variables.trackId, "review"],
      });
    },
  });
};
