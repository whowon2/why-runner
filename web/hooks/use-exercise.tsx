import { useQuery } from "@tanstack/react-query";
import { getExercise } from "@/lib/actions/lessons/get-exercise";

export const useExercise = (exerciseId: string) =>
  useQuery({
    queryKey: ["exercises", exerciseId],
    queryFn: () => getExercise(exerciseId),
  });
