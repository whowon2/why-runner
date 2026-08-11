import { useMutation, useQueryClient } from "@tanstack/react-query";
import { upsertAlgorithmRequirementConstraint } from "@/lib/actions/lessons/upsert-algorithm-requirement-constraint";

export const useUpsertAlgorithmRequirementConstraint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { exerciseId: string; description: string }) => {
      return await upsertAlgorithmRequirementConstraint(input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["exercise-constraints", variables.exerciseId],
      });
    },
  });
};
