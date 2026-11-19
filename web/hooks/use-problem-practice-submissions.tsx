import { useQueryClient } from "@tanstack/react-query";
import {
  submissionRows,
  useJudgeQuery,
  useVerdictTransition,
} from "@/hooks/use-judge-query";
import { getProblemSubmissions } from "@/lib/actions/problems/get-submissions";

/**
 * The viewer's practice submissions on a problem. Polls only while one is
 * being judged; new ones arrive through the submit mutation's invalidation.
 */
export function useProblemPracticeSubmissions(problemId: string) {
  const queryClient = useQueryClient();
  const result = useJudgeQuery({
    queryKey: ["problem-submissions", problemId],
    queryFn: () => getProblemSubmissions(problemId),
    rows: submissionRows,
  });
  useVerdictTransition(result.query.data, () => {
    queryClient.invalidateQueries({ queryKey: ["submissions", "me"] });
  });
  return result;
}
