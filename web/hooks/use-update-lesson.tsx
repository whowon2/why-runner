import {
  type QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { Lesson } from "@/drizzle/schema";
import type { getLesson } from "@/lib/actions/lessons/get-lesson";
import {
  deleteLesson,
  setLessonPublished,
  updateLesson,
} from "@/lib/actions/lessons/update-lesson";

type LessonData = Awaited<ReturnType<typeof getLesson>>;
type Snapshot = { previous?: LessonData; classroomId?: string };

const lessonKey = (lessonId: string) => ["lessons", lessonId] as const;

/**
 * Applies `changes` to the cached lesson right away so the settings UI
 * responds instantly; the returned snapshot rolls it back on error.
 */
async function applyOptimistic(
  queryClient: QueryClient,
  lessonId: string,
  changes: Partial<Lesson>,
): Promise<Snapshot> {
  await queryClient.cancelQueries({ queryKey: lessonKey(lessonId) });
  const previous = queryClient.getQueryData<LessonData>(lessonKey(lessonId));
  if (previous) {
    queryClient.setQueryData<LessonData>(lessonKey(lessonId), {
      ...previous,
      lesson: {
        ...previous.lesson,
        // Omitted fields arrive as `undefined` and must not blank anything.
        ...Object.fromEntries(
          Object.entries(changes).filter(([, value]) => value !== undefined),
        ),
      },
    });
  }
  return { previous, classroomId: previous?.lesson.classroomId };
}

function rollback(
  queryClient: QueryClient,
  lessonId: string,
  context: Snapshot | undefined,
) {
  if (context?.previous) {
    queryClient.setQueryData(lessonKey(lessonId), context.previous);
  }
}

/**
 * Only this lesson's class shows lesson fields (class-page cards, lesson
 * list, gradebook), so only its queries refetch — invalidating every class
 * and exercise query queued ~9 server actions behind each settings change.
 */
function invalidateClass(queryClient: QueryClient, classroomId?: string) {
  queryClient.invalidateQueries({
    queryKey: classroomId ? ["classes", classroomId] : ["classes"],
  });
}

export const useUpdateLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      lessonId: string;
      title?: string;
      description?: string;
      dueDate?: Date | null;
      showOutputs?: boolean;
    }) => {
      return await updateLesson(input);
    },
    onMutate: ({ lessonId, ...changes }) =>
      applyOptimistic(queryClient, lessonId, changes),
    onError: (_error, variables, context) =>
      rollback(queryClient, variables.lessonId, context),
    onSettled: (_data, _error, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: lessonKey(variables.lessonId),
      });
      invalidateClass(queryClient, context?.classroomId);
      // Exercise pages show the due date and (un)masked outputs, but none is
      // on screen while the owner edits the lesson: mark them stale so they
      // refetch when next opened, without refetching now.
      queryClient.invalidateQueries({
        queryKey: ["exercises"],
        refetchType: "none",
      });
    },
  });
};

export const useSetLessonPublished = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { lessonId: string; isPublished: boolean }) => {
      return await setLessonPublished(input);
    },
    onMutate: ({ lessonId, isPublished }) =>
      applyOptimistic(queryClient, lessonId, { isPublished }),
    onError: (_error, variables, context) =>
      rollback(queryClient, variables.lessonId, context),
    onSettled: (_data, _error, variables, context) => {
      queryClient.invalidateQueries({
        queryKey: lessonKey(variables.lessonId),
      });
      // Class-page "unpublished" badge; gradebook only lists published lessons.
      invalidateClass(queryClient, context?.classroomId);
    },
  });
};

export const useDeleteLesson = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (lessonId: string) => {
      return await deleteLesson(lessonId);
    },
    // Read the class id before the lesson (and its cache entry) is gone.
    onMutate: (lessonId): Snapshot => ({
      classroomId: queryClient.getQueryData<LessonData>(lessonKey(lessonId))
        ?.lesson.classroomId,
    }),
    onSuccess: (_data, _lessonId, context) => {
      // Class-detail's lesson cards need to drop the deleted one too.
      invalidateClass(queryClient, context?.classroomId);
    },
  });
};
