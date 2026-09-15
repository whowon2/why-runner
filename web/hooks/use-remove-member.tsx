import { useMutation, useQueryClient } from "@tanstack/react-query";
import { removeMember } from "@/lib/actions/classes/remove-member";

export type RemoveMemberInput = {
  classroomId: string;
  userId: string;
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: RemoveMemberInput) =>
      removeMember(input.classroomId, input.userId),
    onSuccess: (_data, { classroomId }) => {
      queryClient.invalidateQueries({ queryKey: ["classes", classroomId] });
      queryClient.invalidateQueries({ queryKey: ["classes"], exact: true });
    },
  });
};
