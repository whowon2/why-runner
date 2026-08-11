import { useQuery } from "@tanstack/react-query";
import { getPreviousExercise } from "@/lib/actions/lessons/get-exercise";

export const usePreviousExercise = (exerciseId: string) =>
  useQuery({
    queryKey: ["exercises", exerciseId, "previous"],
    queryFn: () => getPreviousExercise(exerciseId),
  });
