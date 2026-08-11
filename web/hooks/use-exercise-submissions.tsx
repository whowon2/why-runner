import { useQuery } from "@tanstack/react-query";
import { getExerciseSubmissions } from "@/lib/actions/lessons/get-exercise-submissions";

export const useExerciseSubmissions = (problemId: string) =>
  useQuery({
    queryKey: ["submissions", "exercise", problemId],
    queryFn: () => getExerciseSubmissions(problemId),
    refetchInterval: 10000,
  });
