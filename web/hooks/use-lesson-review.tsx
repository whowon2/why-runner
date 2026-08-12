import { useQuery } from "@tanstack/react-query";
import { getLessonReview } from "@/lib/actions/lessons/get-lesson-review";

export const useLessonReview = (lessonId: string) =>
  useQuery({
    queryKey: ["lessons", lessonId, "review"],
    queryFn: () => getLessonReview(lessonId),
  });
