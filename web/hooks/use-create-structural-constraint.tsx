import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { StructuralConstraintRuleType } from "@/drizzle/schema";
import { createStructuralConstraint } from "@/lib/actions/lessons/create-structural-constraint";

type Input = {
  exerciseId: string;
  ruleType: StructuralConstraintRuleType;
  ruleParams: Record<string, unknown>;
};

export const useCreateStructuralConstraint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Input) => {
      return await createStructuralConstraint(input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["exercise-constraints", variables.exerciseId],
      });
    },
  });
};
