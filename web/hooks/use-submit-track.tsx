import { useMutation, useQueryClient } from "@tanstack/react-query";
import { submitTrack } from "@/lib/actions/lessons/submit-track";

export const useSubmitTrack = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (trackId: string) => {
      return await submitTrack(trackId);
    },
    onSuccess: (_data, trackId) => {
      queryClient.invalidateQueries({ queryKey: ["tracks", trackId] });
    },
  });
};
