import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExerciseMode, Language } from "@/drizzle/schema";
import {
  checkParsonsSolution,
  getExerciseModeState,
  setExerciseMode,
} from "@/lib/actions/lessons/exercise-mode";

export const useExerciseModeState = (exerciseId: string) =>
  useQuery({
    queryKey: ["exercise-mode", exerciseId],
    queryFn: async () => {
      return await getExerciseModeState(exerciseId);
    },
    refetchInterval: (query) => {
      const status = query.state.data?.latestParsonsCheck?.status;
      return status === "PENDING" || status === "RUNNING" ? 2000 : false;
    },
  });

export const useCheckParsonsSolution = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      exerciseId: string;
      code: string;
      language: Language;
    }) => {
      return await checkParsonsSolution(input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["exercise-mode", variables.exerciseId],
      });
    },
  });
};

export const useSetExerciseMode = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { exerciseId: string; mode: ExerciseMode }) => {
      return await setExerciseMode(input);
    },
    onSuccess: (updated, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["exercise-mode", variables.exerciseId],
      });
      // The student-facing exercise page picks its editor from `mode`.
      queryClient.invalidateQueries({
        queryKey: ["exercises", variables.exerciseId],
      });
      // Lesson roadmap shows each exercise's language/mode badge; the lesson
      // detail query and its review both live under ["lessons", lessonId].
      queryClient.invalidateQueries({
        queryKey: ["lessons", updated.lessonId],
      });
    },
  });
};
