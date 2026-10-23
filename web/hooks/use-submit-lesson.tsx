import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitLesson } from "@/lib/actions/lessons/submit-lesson";

export const useSubmitLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lessonId: string) => {
      return await submitLesson(lessonId);
    },
    onSuccess: (_data, lessonId) => {
      queryClient.invalidateQueries({ queryKey: ["lessons", lessonId] });
      // Handing the lesson in makes the student eligible for its survey.
      queryClient.invalidateQueries({ queryKey: ["surveys"] });
    },
  });
};
