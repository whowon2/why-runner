import { useQuery } from "@tanstack/react-query";
import { getLessonConstraints } from "@/lib/actions/lessons/get-lesson-constraints";

export const useLessonConstraints = (lessonId: string) =>
  useQuery({
    queryKey: ["lesson-constraints", lessonId],
    queryFn: async () => {
      return await getLessonConstraints(lessonId);
    },
  });
