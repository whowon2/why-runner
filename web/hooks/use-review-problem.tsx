import { useMutation } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { unwrap } from "@/lib/action-result";
import { reviewProblem } from "@/lib/actions/problems/review-problem";

export const useReviewProblem = () => {
  const locale = useLocale();
  return useMutation({
    mutationFn: async (problemId: string) => {
      return unwrap(await reviewProblem(problemId, locale));
    },
  });
};
