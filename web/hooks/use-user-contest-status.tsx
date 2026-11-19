import { useQuery } from "@tanstack/react-query";
import { getUserContestStatus } from "@/lib/actions/contest/get-user-contest-status";

/**
 * The viewer's solved problems in a contest. No polling: it only changes on
 * the viewer's own verdict, which `useProblemSubmissions` invalidates.
 */
export const useUserContestStatus = (contestId: string) =>
  useQuery({
    queryKey: ["user-contest-status", contestId],
    queryFn: () => getUserContestStatus(contestId),
  });
