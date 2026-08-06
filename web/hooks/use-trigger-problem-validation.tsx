import { useMutation, useQueryClient } from "@tanstack/react-query";
import { triggerProblemValidation } from "@/lib/actions/problems/trigger-problem-validation";

export const useTriggerProblemValidation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (problemId: string) => {
      return await triggerProblemValidation(problemId);
    },
    onSuccess: (_data, problemId) => {
      queryClient.invalidateQueries({
        queryKey: ["problem-validation", problemId],
      });
    },
  });
};
