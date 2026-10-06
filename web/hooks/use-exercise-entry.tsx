import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateExerciseInput } from "@/drizzle/schema";
import {
  createExercise,
  deleteExerciseEntry,
  moveExerciseEntry,
} from "@/lib/actions/lessons/create-exercise";

export const useCreateExerciseEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<CreateExerciseInput, "slug">) => {
      return await createExercise(input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["lessons", variables.lessonId],
      });
    },
  });
};

export const useMoveExerciseEntry = (lessonId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      exerciseId: string;
      direction: "up" | "down";
    }) => {
      return await moveExerciseEntry(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons", lessonId] });
      // Exercise pages' next/previous links follow lesson order.
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
  });
};

export const useDeleteExerciseEntry = (lessonId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (exerciseId: string) => {
      return await deleteExerciseEntry(exerciseId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons", lessonId] });
      // Class-page lesson cards show exercise counts; neighbouring
      // exercises' next/previous links skip the removed one.
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: ["exercises"] });
    },
  });
};
