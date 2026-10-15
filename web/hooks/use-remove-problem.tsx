import { useMutation, useQueryClient } from "@tanstack/react-query";
import { contestLeaderboardKey } from "@/hooks/use-contest-leaderboard";
import { unwrap } from "@/lib/action-result";
import { removeProblemFromContest } from "@/lib/actions/contest/remove-problem";

export type RemoveProblemFromContestInput = {
  contestId: string;
  problemId: string;
};

export const useRemoveProblemFromContest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RemoveProblemFromContestInput) => {
      return unwrap(await removeProblemFromContest(input));
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["contest", String(variables.contestId)],
      });
      queryClient.invalidateQueries({
        queryKey: contestLeaderboardKey(variables.contestId),
      });
    },
  });
};
