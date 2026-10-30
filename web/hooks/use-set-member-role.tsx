import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ClassroomRole } from "@/drizzle/schema";
import { setMemberRole } from "@/lib/actions/classes/set-member-role";
import { invalidateClassRoster } from "./use-class-roster-invalidation";

export const useSetMemberRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      classroomId: string;
      userId: string;
      role: ClassroomRole;
    }) => setMemberRole(input),
    onSuccess: () => invalidateClassRoster(queryClient),
  });
};
