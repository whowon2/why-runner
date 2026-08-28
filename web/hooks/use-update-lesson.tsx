import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  deleteLesson,
  setLessonPublished,
  updateLesson,
} from "@/lib/actions/lessons/update-lesson";

export const useUpdateLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      lessonId: string;
      title?: string;
      description?: string;
      dueDate?: Date | null;
      showOutputs?: boolean;
    }) => {
      return await updateLesson(input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["lessons", variables.lessonId],
      });
    },
  });
};

export const useSetLessonPublished = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { lessonId: string; isPublished: boolean }) => {
      return await setLessonPublished(input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["lessons", variables.lessonId],
      });
    },
  });
};

export const useDeleteLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lessonId: string) => {
      return await deleteLesson(lessonId);
    },
    onSuccess: () => {
      // Class-detail's lesson cards need to drop the deleted one too.
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
};
