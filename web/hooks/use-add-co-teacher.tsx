import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unwrap } from "@/lib/action-result";
import { addCoTeacher } from "@/lib/actions/classes/add-co-teacher";
import { invalidateClassRoster } from "./use-class-roster-invalidation";

export type AddCoTeacherInput = { classroomId: string } & (
  | { userId: string }
  | { usernameOrEmail: string }
);

export const useAddCoTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AddCoTeacherInput) =>
      unwrap(await addCoTeacher(input)),
    onSuccess: () => invalidateClassRoster(queryClient),
  });
};
