import { useQuery } from "@tanstack/react-query";
import { getLessonSubmissions } from "@/lib/actions/lessons/get-lesson-submissions";

export const useLessonSubmissions = (problemId: string) =>
  useQuery({
    queryKey: ["submissions", "lesson", problemId],
    queryFn: () => getLessonSubmissions(problemId),
    refetchInterval: 10000,
  });
