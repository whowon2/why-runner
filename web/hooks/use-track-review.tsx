import { useQuery } from "@tanstack/react-query";
import { getTrackReview } from "@/lib/actions/lessons/get-track-review";

export const useTrackReview = (trackId: string) =>
  useQuery({
    queryKey: ["tracks", trackId, "review"],
    queryFn: () => getTrackReview(trackId),
  });
