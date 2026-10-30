import { useQuery } from "@tanstack/react-query";
import { isPendingStatus } from "@/lib/submission-status";
import { getExerciseSubmissions } from "@/lib/actions/lessons/get-exercise-submissions";

export const useExerciseSubmissions = (exerciseId: string) =>
  useQuery({
    queryKey: ["submissions", "exercise", exerciseId],
    queryFn: () => getExerciseSubmissions(exerciseId),
    // Fast while something is being judged, so the editor's verdict
    // updates soon after the judge finishes.
    refetchInterval: (query) =>
      query.state.data?.some((s) => isPendingStatus(s.status)) ? 2000 : 10000,
  });
