import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateLessonInput } from "@/drizzle/schema";
import {
  createLesson,
  deleteLessonEntry,
  reorderLessonEntry,
} from "@/lib/actions/lessons/create-lesson";

export const useCreateLessonEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateLessonInput) => {
      return await createLesson(input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tracks", variables.trackId],
      });
    },
  });
};

export const useReorderLessonEntry = (trackId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { lessonId: string; order: number }) => {
      return await reorderLessonEntry(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracks", trackId] });
    },
  });
};

export const useDeleteLessonEntry = (trackId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lessonId: string) => {
      return await deleteLessonEntry(lessonId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tracks", trackId] });
    },
  });
};
