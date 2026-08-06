import { useQuery } from "@tanstack/react-query";
import { getUnreadNotificationCount } from "@/lib/actions/notifications/get-unread-count";

export const useUnreadNotificationCount = () =>
  useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => getUnreadNotificationCount(),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
