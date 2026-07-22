import { useQuery } from "@tanstack/react-query";
import { getProblemForEdit } from "@/lib/actions/problems/get-problem-for-edit";

export const useProblemForEdit = (problemId: string) =>
  useQuery({
    queryKey: ["problems", "edit", problemId],
    queryFn: async () => {
      return await getProblemForEdit(problemId);
    },
  });
