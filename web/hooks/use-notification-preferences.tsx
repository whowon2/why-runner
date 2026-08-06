import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { NotificationType } from "@/drizzle/schema";
import { getNotificationPreferences } from "@/lib/actions/notifications/get-preferences";
import { updateNotificationPreference } from "@/lib/actions/notifications/update-preference";

export const useNotificationPreferences = () =>
  useQuery({
    queryKey: ["notifications", "preferences"],
    queryFn: () => getNotificationPreferences(),
  });

export const useUpdateNotificationPreference = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      type,
      enabled,
    }: {
      type: NotificationType;
      enabled: boolean;
    }) => updateNotificationPreference(type, enabled),
    onMutate: async ({ type, enabled }) => {
      await queryClient.cancelQueries({
        queryKey: ["notifications", "preferences"],
      });
      const previous = queryClient.getQueryData<
        { type: NotificationType; enabled: boolean }[]
      >(["notifications", "preferences"]);

      if (previous) {
        queryClient.setQueryData(
          ["notifications", "preferences"],
          previous.map((p) => (p.type === type ? { ...p, enabled } : p)),
        );
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["notifications", "preferences"],
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", "preferences"],
      });
    },
  });
};
