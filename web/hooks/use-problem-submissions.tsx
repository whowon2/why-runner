import { useQuery } from "@tanstack/react-query";
import { isPendingStatus } from "@/lib/submission-status";
import { getContestSubmissions } from "@/lib/actions/contest/get-submissions";

export type GetUserSubmissionsOnContest = {
  userId: string;
  contestId: string;
  problemId: string;
};

export const useProblemSubmissions = (input: GetUserSubmissionsOnContest) =>
  useQuery({
    queryKey: ["submissions", String(input.problemId)],
    queryFn: () => getContestSubmissions(input),
    // Fast while something is being judged, so the editor's verdict
    // updates soon after the judge finishes.
    refetchInterval: (query) =>
      query.state.data?.some((s) => isPendingStatus(s.status)) ? 2000 : 10000,
  });
