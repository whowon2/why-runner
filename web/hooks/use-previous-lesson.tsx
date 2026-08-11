import { useQuery } from "@tanstack/react-query";
import { getPreviousLesson } from "@/lib/actions/lessons/get-lesson";

export const usePreviousLesson = (lessonId: string) =>
  useQuery({
    queryKey: ["lessons", lessonId, "previous"],
    queryFn: () => getPreviousLesson(lessonId),
  });
