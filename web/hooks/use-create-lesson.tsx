import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLesson } from "@/lib/actions/lessons/create-lesson";

export const useCreateLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { classroomId: string }) => {
      return await createLesson(input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["classes", variables.classroomId],
      });
    },
  });
};
