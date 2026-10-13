import { useQuery } from "@tanstack/react-query";
import { retryUnlessActionError, unwrap } from "@/lib/action-result";
import { getLessonReview } from "@/lib/actions/lessons/get-lesson-review";

export const useLessonReview = (lessonId: string) =>
  useQuery({
    queryKey: ["lessons", lessonId, "review"],
    queryFn: async () => unwrap(await getLessonReview(lessonId)),
    retry: retryUnlessActionError,
  });
