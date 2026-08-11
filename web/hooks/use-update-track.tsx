import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  setTrackPublished,
  updateTrack,
} from "@/lib/actions/lessons/update-track";

export const useUpdateTrack = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      trackId: string;
      title?: string;
      description?: string;
      dueDate?: Date | null;
    }) => {
      return await updateTrack(input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tracks", variables.trackId],
      });
    },
  });
};

export const useSetTrackPublished = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { trackId: string; isPublished: boolean }) => {
      return await setTrackPublished(input);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tracks", variables.trackId],
      });
    },
  });
};
