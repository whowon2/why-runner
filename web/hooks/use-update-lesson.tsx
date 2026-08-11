import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
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
