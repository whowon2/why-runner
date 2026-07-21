import { useQuery } from "@tanstack/react-query";
import { getLesson } from "@/lib/actions/lessons/get-lesson";

export const useLesson = (lessonId: string) =>
  useQuery({
    queryKey: ["lessons", lessonId],
    queryFn: () => getLesson(lessonId),
  });
