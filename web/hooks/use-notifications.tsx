import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getNotifications } from "@/lib/actions/notifications/get-notifications";
import { markAllNotificationsRead } from "@/lib/actions/notifications/mark-all-read";
import { markNotificationRead } from "@/lib/actions/notifications/mark-read";

export const useNotifications = () =>
  useQuery({
    queryKey: ["notifications"],
    queryFn: () => getNotifications(),
  });

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({
        queryKey: ["notifications", "unread-count"],
      });
    },
  });
};
