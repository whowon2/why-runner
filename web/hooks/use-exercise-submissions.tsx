import { useQueryClient } from "@tanstack/react-query";
import {
  submissionRows,
  useJudgeQuery,
  useVerdictTransition,
} from "@/hooks/use-judge-query";
import { getExerciseSubmissions } from "@/lib/actions/lessons/get-exercise-submissions";

/**
 * The viewer's submissions on an exercise. Polls only while one is being
 * judged; new ones arrive through the submit mutation's invalidation.
 */
export function useExerciseSubmissions(exerciseId: string) {
  const queryClient = useQueryClient();
  const result = useJudgeQuery({
    queryKey: ["submissions", "exercise", exerciseId],
    queryFn: () => getExerciseSubmissions(exerciseId),
    rows: submissionRows,
  });
  useVerdictTransition(result.query.data, () => {
    queryClient.invalidateQueries({ queryKey: ["submissions", "me"] });
  });
  return result;
}
