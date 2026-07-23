import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFollowState } from "@/lib/actions/follow/get-follow-state";
import { toggleFollow } from "@/lib/actions/follow/toggle-follow";

export const useFollowState = (targetUserId: string) =>
  useQuery({
    queryKey: ["follow-state", targetUserId],
    queryFn: () => getFollowState(targetUserId),
  });

export const useToggleFollow = (targetUserId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => toggleFollow(targetUserId),
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: ["follow-state", targetUserId],
      });
      const previous = queryClient.getQueryData<{
        isFollowing: boolean;
        followerCount: number;
        followingCount: number;
      }>(["follow-state", targetUserId]);

      if (previous) {
        queryClient.setQueryData(["follow-state", targetUserId], {
          ...previous,
          isFollowing: !previous.isFollowing,
          followerCount:
            previous.followerCount + (previous.isFollowing ? -1 : 1),
        });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["follow-state", targetUserId],
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["follow-state", targetUserId],
      });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
};
