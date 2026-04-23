import { useQuery } from "@tanstack/react-query";
import { getUserContestStatus } from "@/lib/actions/contest/get-user-contest-status";

export const useUserContestStatus = (contestId: string) =>
  useQuery({
    queryKey: ["user-contest-status", contestId],
    queryFn: () => getUserContestStatus(contestId),
    refetchInterval: 10000,
  });
