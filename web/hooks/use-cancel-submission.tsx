import { useMutation, useQueryClient } from "@tanstack/react-query";
import { contestLeaderboardKey } from "@/hooks/use-contest-leaderboard";
import { unwrap } from "@/lib/action-result";
import { cancelSubmission } from "@/lib/actions/submissions/cancel-submission";

/**
 * Cancels a still-PENDING submission. The caller doesn't say which context
 * it came from, so every submission list (contest, practice, exercise, own
 * history) is refreshed, plus the stats and standings that count attempts.
 */
export const useCancelSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (submissionId: string) =>
      unwrap(await cancelSubmission(submissionId)),
    onSettled: (data) => {
      // Also on ALREADY_RUNNING: the row moved on, show its real status.
      queryClient.invalidateQueries({ queryKey: ["submissions"] });
      queryClient.invalidateQueries({ queryKey: ["problem-submissions"] });
      queryClient.invalidateQueries({ queryKey: ["problem-statistics"] });
      if (data?.contestId) {
        queryClient.invalidateQueries({
          queryKey: contestLeaderboardKey(data.contestId),
        });
      }
    },
  });
};
