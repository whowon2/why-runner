import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unwrap } from "@/lib/action-result";
import { addCoTeacher } from "@/lib/actions/classes/add-co-teacher";
import { invalidateClassRoster } from "./use-class-roster-invalidation";

export const useAddCoTeacher = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      classroomId: string;
      usernameOrEmail: string;
    }) => unwrap(await addCoTeacher(input)),
    onSuccess: () => invalidateClassRoster(queryClient),
  });
};
