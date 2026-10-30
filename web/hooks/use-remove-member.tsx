import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeMember } from "@/lib/actions/classes/remove-member";
import { invalidateClassRoster } from "./use-class-roster-invalidation";

export type RemoveMemberInput = {
  classroomId: string;
  userId: string;
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RemoveMemberInput) =>
      removeMember(input.classroomId, input.userId),
    onSuccess: () => invalidateClassRoster(queryClient),
  });
};
