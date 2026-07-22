import { useQuery } from "@tanstack/react-query";
import { getNextLesson } from "@/lib/actions/lessons/get-lesson";

export const useNextLesson = (lessonId: string) =>
  useQuery({
    queryKey: ["lessons", lessonId, "next"],
    queryFn: () => getNextLesson(lessonId),
  });
