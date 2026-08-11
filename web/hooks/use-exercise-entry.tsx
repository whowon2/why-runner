import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateExerciseInput } from "@/drizzle/schema";
import {
  createExercise,
  deleteExerciseEntry,
  reorderExerciseEntry,
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

export const useReorderExerciseEntry = (lessonId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { exerciseId: string; order: number }) => {
      return await reorderExerciseEntry(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lessons", lessonId] });
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
    },
  });
};
