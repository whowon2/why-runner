import { submissionRows, useJudgeQuery } from "@/hooks/use-judge-query";
import { getProblemValidation } from "@/lib/actions/problems/get-problem-validation";

/** The problem's validation state; polls the latest run while it's judged. */
export const useProblemValidation = (problemId: string) =>
  useJudgeQuery({
    queryKey: ["problem-validation", problemId],
    queryFn: () => getProblemValidation(problemId),
    rows: (data) => submissionRows(data?.latest && [data.latest]),
  });
