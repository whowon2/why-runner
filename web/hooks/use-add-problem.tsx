import { useMutation, useQueryClient } from "@tanstack/react-query";
import { contestLeaderboardKey } from "@/hooks/use-contest-leaderboard";
import { unwrap } from "@/lib/action-result";
import {
  type AddProblemToContestInput,
  addProblemToContest,
} from "@/lib/actions/contest/add-problem";

export type { AddProblemToContestInput };

export const useAddProblemToContest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddProblemToContestInput) => {
      return unwrap(await addProblemToContest(input));
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
