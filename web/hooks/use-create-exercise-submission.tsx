import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unwrap } from "@/lib/action-result";
import {
  createExerciseSubmission,
  type ExerciseSubmissionInput,
} from "@/lib/actions/lessons/create-exercise-submission";

export const useCreateExerciseSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ExerciseSubmissionInput) => {
      return unwrap(await createExerciseSubmission(input));
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["submissions", "exercise", variables.exerciseId],
      });
      queryClient.invalidateQueries({ queryKey: ["submissions", "me"] });
    },
  });
};
