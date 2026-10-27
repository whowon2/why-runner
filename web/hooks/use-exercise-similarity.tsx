import { useQuery } from "@tanstack/react-query";
import { retryUnlessActionError, unwrap } from "@/lib/action-result";
import { getExerciseSimilarity } from "@/lib/actions/similarity/get-exercise-similarity";
import type { PickMode } from "@/lib/similarity/pick";

export const useExerciseSimilarity = (exerciseId: string, pick: PickMode) =>
  useQuery({
    queryKey: ["exercises", exerciseId, "similarity", pick],
    queryFn: async () =>
      unwrap(await getExerciseSimilarity({ exerciseId, pick })),
    retry: retryUnlessActionError,
  });
