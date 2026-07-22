import { useQuery } from "@tanstack/react-query";
import { getProblemTests } from "@/lib/actions/problems/get-problem-tests";

export const useProblemTests = (
  problemId: string,
  options?: { enabled?: boolean },
) =>
  useQuery({
    queryKey: ["problem-tests", problemId],
    queryFn: async () => {
      return await getProblemTests(problemId);
    },
    enabled: options?.enabled ?? true,
  });
