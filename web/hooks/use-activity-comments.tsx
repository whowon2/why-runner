import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addActivityComment } from "@/lib/actions/activity/add-comment";
import { deleteActivityComment } from "@/lib/actions/activity/delete-comment";

export const useAddActivityComment = (activityId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) => addActivityComment(activityId, content),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-engagement"] });
    },
  });
};

export const useDeleteActivityComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => deleteActivityComment(commentId),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["activity-engagement"] });
    },
  });
};
