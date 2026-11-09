import { useQuery } from "@tanstack/react-query";
import { getExerciseStatistics } from "@/lib/actions/lessons/get-exercise-statistics";

// Under the "problem-statistics" prefix so every invalidation of problem
// statistics (e.g. a canceled submission) also refreshes this one.
export const useExerciseStatistics = (exerciseId: string) =>
  useQuery({
    queryKey: ["problem-statistics", "exercise", exerciseId],
    queryFn: () => getExerciseStatistics(exerciseId),
  });
