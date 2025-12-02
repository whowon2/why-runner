import { useQuery } from "@tanstack/react-query";
import { getContestLeaderboard } from "@/lib/actions/get-contest-leaderboard";

export const useContestLeaderboard = (contestId: number) =>
  useQuery({
    queryKey: ["contests", contestId],
    queryFn: async () => {
      return await getContestLeaderboard(contestId);
    },
  });
