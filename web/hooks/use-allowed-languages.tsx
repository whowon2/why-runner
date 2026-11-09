import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unwrap } from "@/lib/action-result";
import {
  type SetContestProblemLanguagesInput,
  setContestProblemLanguages,
} from "@/lib/actions/contest/set-problem-languages";
import {
  type SetExerciseAllowedLanguagesInput,
  setExerciseAllowedLanguages,
} from "@/lib/actions/lessons/exercise-languages";

export const useSetExerciseAllowedLanguages = (lessonId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SetExerciseAllowedLanguagesInput) =>
      setExerciseAllowedLanguages(input),
    onSuccess: (_data, variables) => {
      // Roadmap badges and the exercise workspace's selector.
      queryClient.invalidateQueries({ queryKey: ["lessons", lessonId] });
      queryClient.invalidateQueries({
        queryKey: ["exercises", variables.exerciseId],
      });
    },
  });
};

export const useSetContestProblemLanguages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: SetContestProblemLanguagesInput) =>
      unwrap(await setContestProblemLanguages(input)),
    onSuccess: (_data, variables) => {
      // Settings list and the contest problem workspace both read `contest`.
      queryClient.invalidateQueries({
        queryKey: ["contest", String(variables.contestId)],
      });
    },
  });
};
