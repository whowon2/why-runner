import { useQuery } from "@tanstack/react-query";
import { getTrack } from "@/lib/actions/lessons/get-track";

export const useTrack = (trackId: string) =>
  useQuery({
    queryKey: ["tracks", trackId],
    queryFn: () => getTrack(trackId),
  });
