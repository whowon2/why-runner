import { useQuery } from "@tanstack/react-query";
import { getProblemSubmissions } from "@/lib/actions/problems/get-submissions";

export const useProblemPracticeSubmissions = (problemId: string) =>
  useQuery({
    queryKey: ["problem-submissions", problemId],
    queryFn: async () => {
      return await getProblemSubmissions(problemId);
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      const hasPending = data?.some(
        (s) => s.status === "PENDING" || s.status === "RUNNING",
      );
      return hasPending ? 2000 : false;
    },
  });
