import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { StructuralConstraintRuleType } from "@/drizzle/schema";
import { updateStructuralConstraint } from "@/lib/actions/lessons/update-structural-constraint";

type Input = {
  id: string;
  lessonId: string;
  ruleType: StructuralConstraintRuleType;
  ruleParams: Record<string, unknown>;
};

export const useUpdateStructuralConstraint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Input) => {
      return await updateStructuralConstraint(input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["lesson-constraints", variables.lessonId],
      });
    },
  });
};
