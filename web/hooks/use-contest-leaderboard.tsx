import { useQuery } from "@tanstack/react-query";
import { getContestLeaderboard } from "@/lib/actions/contest/get-contest-leaderboard";

const REFRESH_MS = 10_000;
// setTimeout overflows above 2^31-1 ms (~24.8 days).
const MAX_TIMEOUT_MS = 2 ** 31 - 1;

export const contestLeaderboardKey = (contestId: string) => [
  "contest-leaderboard",
  String(contestId),
];

export const useContestLeaderboard = ({
  contestId,
  startDate,
  endDate,
}: {
  contestId: string;
  startDate: Date | null;
  endDate: Date | null;
}) =>
  useQuery({
    queryKey: contestLeaderboardKey(contestId),
    queryFn: () => getContestLeaderboard(contestId),
    // Poll only while the contest is running; re-evaluated after each fetch,
    // so it stops on its own once the end passes. Before the start, a single
    // refetch is scheduled for the start time so open tabs pick it up.
    refetchInterval: () => {
      const now = Date.now();
      if (startDate && now < new Date(startDate).getTime())
        return Math.min(new Date(startDate).getTime() - now, MAX_TIMEOUT_MS);
      if (endDate && now >= new Date(endDate).getTime()) return false;
      if (!startDate && !endDate) return false;
      return REFRESH_MS;
    },
  });
