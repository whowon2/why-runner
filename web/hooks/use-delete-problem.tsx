import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteProblem } from "@/lib/actions/problems/delete-problem";

export const useDeleteProblem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (problemId: string) => deleteProblem(problemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["problems"] });
    },
  });
};
