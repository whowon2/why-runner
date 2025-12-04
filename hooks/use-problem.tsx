import { useQuery } from "@tanstack/react-query";
import { getProblem } from "@/lib/actions/problems/get-problem";

export const useProblem = (problemId: number) =>
  useQuery({
    queryKey: ["problems", problemId],
    queryFn: async () => {
      return await getProblem(problemId);
    },
  });
