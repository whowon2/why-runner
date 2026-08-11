import { useQuery } from "@tanstack/react-query";
import { getNextExercise } from "@/lib/actions/lessons/get-exercise";

export const useNextExercise = (exerciseId: string) =>
  useQuery({
    queryKey: ["exercises", exerciseId, "next"],
    queryFn: () => getNextExercise(exerciseId),
  });
