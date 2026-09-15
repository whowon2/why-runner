import { useMutation, useQueryClient } from "@tanstack/react-query";
import { leaveClass } from "@/lib/actions/classes/leave-class";

export const useLeaveClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (classroomId: string) => leaveClass(classroomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
};
