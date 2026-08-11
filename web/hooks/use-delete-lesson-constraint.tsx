import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteLessonConstraint } from "@/lib/actions/lessons/delete-lesson-constraint";

export const useDeleteLessonConstraint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; lessonId: string }) => {
      return await deleteLessonConstraint(input.id);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["lesson-constraints", variables.lessonId],
      });
    },
  });
};
