import { useQuery } from "@tanstack/react-query";
import { getProblemStatistics } from "@/lib/actions/problems/get-problem-statistics";

export const useProblemStatistics = (problemId: string) =>
  useQuery({
    queryKey: ["problem-statistics", problemId],
    queryFn: async () => {
      return await getProblemStatistics(problemId);
    },
  });
