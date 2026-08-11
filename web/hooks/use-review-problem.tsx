import { useMutation } from "@tanstack/react-query";
import { reviewProblem } from "@/lib/actions/problems/review-problem";

export const useReviewProblem = () =>
  useMutation({
    mutationFn: async (problemId: string) => {
      return await reviewProblem(problemId);
    },
  });
