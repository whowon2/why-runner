import { useQuery } from "@tanstack/react-query";
import { getExerciseSubmissions } from "@/lib/actions/lessons/get-exercise-submissions";

export const useExerciseSubmissions = (exerciseId: string) =>
  useQuery({
    queryKey: ["submissions", "exercise", exerciseId],
    queryFn: () => getExerciseSubmissions(exerciseId),
    refetchInterval: 10000,
  });
