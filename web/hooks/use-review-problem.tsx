import { useMutation } from "@tanstack/react-query";
import { unwrap } from "@/lib/action-result";
import { reviewProblem } from "@/lib/actions/problems/review-problem";

export const useReviewProblem = () =>
  useMutation({
    mutationFn: async (problemId: string) => {
      return unwrap(await reviewProblem(problemId));
    },
  });
