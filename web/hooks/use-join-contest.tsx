import { useMutation, useQueryClient } from "@tanstack/react-query";
import { contestLeaderboardKey } from "@/hooks/use-contest-leaderboard";
import { joinContest } from "@/lib/actions/contest/join-contest";

export type JoinContestInput = {
  contestId: string;
  userId: string;
};

export const useJoinContest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: JoinContestInput) => {
      return await joinContest(input);
    },
    onSuccess: (_data, { contestId }) => {
      queryClient.invalidateQueries({
        queryKey: ["contest", String(contestId)],
      });
      queryClient.invalidateQueries({
        queryKey: contestLeaderboardKey(contestId),
      });
      queryClient.invalidateQueries({
        queryKey: ["user-contest-status", contestId],
      });
    },
  });
};
