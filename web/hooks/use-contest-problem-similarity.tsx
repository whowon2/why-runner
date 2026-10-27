import { useQuery } from "@tanstack/react-query";
import { retryUnlessActionError, unwrap } from "@/lib/action-result";
import { getContestProblemSimilarity } from "@/lib/actions/similarity/get-contest-problem-similarity";
import type { PickMode } from "@/lib/similarity/pick";

export const useContestProblemSimilarity = (
  contestId: string,
  problemId: string | null,
  pick: PickMode,
) =>
  useQuery({
    queryKey: ["contests", contestId, "similarity", problemId, pick],
    queryFn: async () =>
      unwrap(
        await getContestProblemSimilarity({
          contestId,
          problemId: problemId as string,
          pick,
        }),
      ),
    enabled: !!problemId,
    retry: retryUnlessActionError,
  });
