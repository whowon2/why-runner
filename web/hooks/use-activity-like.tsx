import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getActivityEngagement } from "@/lib/actions/activity/get-activity-engagement";
import { toggleActivityLike } from "@/lib/actions/activity/toggle-like";

export const useActivityEngagement = (activityIds: string[]) =>
  useQuery({
    queryKey: ["activity-engagement", activityIds],
    queryFn: () => getActivityEngagement(activityIds),
    enabled: activityIds.length > 0,
  });

export const useActivityLike = (activityId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => toggleActivityLike(activityId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-engagement"] });
    },
  });
};
