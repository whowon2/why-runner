import { useQueryClient } from "@tanstack/react-query";
import { contestLeaderboardKey } from "@/hooks/use-contest-leaderboard";
import {
  submissionRows,
  useJudgeQuery,
  useVerdictTransition,
} from "@/hooks/use-judge-query";
import { getContestSubmissions } from "@/lib/actions/contest/get-submissions";

export type GetUserSubmissionsOnContest = {
  userId: string;
  contestId: string;
  problemId: string;
};

/**
 * The viewer's submissions on a contest problem. Polls only while one is
 * being judged; new ones arrive through the submit mutation's invalidation.
 * A verdict refreshes the solved problems, the leaderboard and the history.
 */
export function useProblemSubmissions(input: GetUserSubmissionsOnContest) {
  const queryClient = useQueryClient();
  const result = useJudgeQuery({
    queryKey: ["submissions", String(input.problemId)],
    queryFn: () => getContestSubmissions(input),
    rows: submissionRows,
  });
  useVerdictTransition(result.query.data, () => {
    queryClient.invalidateQueries({
      queryKey: ["user-contest-status", input.contestId],
    });
    queryClient.invalidateQueries({
      queryKey: contestLeaderboardKey(input.contestId),
    });
    queryClient.invalidateQueries({ queryKey: ["submissions", "me"] });
  });
  return result;
}
