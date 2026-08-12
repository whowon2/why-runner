import { useQuery } from "@tanstack/react-query";
import { getExerciseConstraints } from "@/lib/actions/lessons/get-exercise-constraints";

export const useExerciseConstraints = (exerciseId: string) =>
  useQuery({
    queryKey: ["exercise-constraints", exerciseId],
    queryFn: async () => {
      return await getExerciseConstraints(exerciseId);
    },
  });
