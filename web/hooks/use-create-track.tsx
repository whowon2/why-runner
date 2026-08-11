import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createTrack } from "@/lib/actions/lessons/create-track";

export const useCreateTrack = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { classroomId: string }) => {
      return await createTrack(input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["classes", variables.classroomId],
      });
    },
  });
};
