import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteExerciseConstraint } from "@/lib/actions/lessons/delete-exercise-constraint";

export const useDeleteExerciseConstraint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; exerciseId: string }) => {
      return await deleteExerciseConstraint(input.id);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["exercise-constraints", variables.exerciseId],
      });
    },
  });
};
