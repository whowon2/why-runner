import { useQuery } from "@tanstack/react-query";
import { getProblemValidation } from "@/lib/actions/problems/get-problem-validation";

export const useProblemValidation = (problemId: string) =>
  useQuery({
    queryKey: ["problem-validation", problemId],
    queryFn: async () => {
      return await getProblemValidation(problemId);
    },
    refetchInterval: (query) => {
      const status = query.state.data?.latest?.status;
      return status === "PENDING" || status === "RUNNING" ? 2000 : false;
    },
  });
