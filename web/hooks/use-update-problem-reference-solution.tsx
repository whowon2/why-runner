import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Language } from "@/drizzle/schema";
import { updateProblemReferenceSolution } from "@/lib/actions/problems/update-problem-reference-solution";

type UpdateProblemReferenceSolutionInput = {
  problemId: string;
  code: string;
  language: Language | null;
};

export const useUpdateProblemReferenceSolution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProblemReferenceSolutionInput) => {
      return await updateProblemReferenceSolution(input);
    },
    onSuccess: (_data, variables) => {
      // Keeps the workspace's validation panel (which also shows the saved
      // reference solution) in sync with what was just persisted.
      queryClient.invalidateQueries({
        queryKey: ["problem-validation", variables.problemId],
      });
    },
  });
};
