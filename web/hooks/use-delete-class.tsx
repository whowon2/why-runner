import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteClass } from "@/lib/actions/classes/delete-class";

export const useDeleteClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (classroomId: string) => deleteClass(classroomId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
};
