import { useMutation, useQueryClient } from "@tanstack/react-query";
import { homeDataKey } from "@/hooks/use-home-data";
import { contestLeaderboardKey } from "@/hooks/use-contest-leaderboard";
import { leaveContest } from "@/lib/actions/contest/leave-contest";

export type LeaveContestInput = {
  contestId: string;
  userId: string;
};

export const useLeaveContest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LeaveContestInput) => {
      return await leaveContest(input);
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
      queryClient.invalidateQueries({ queryKey: homeDataKey });
    },
  });
};
