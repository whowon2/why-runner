import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateClass } from "@/lib/actions/classes/update-class";

export const useUpdateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { classroomId: string; name: string }) => {
      return await updateClass(input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({
        queryKey: ["classes", variables.classroomId],
      });
    },
  });
};
