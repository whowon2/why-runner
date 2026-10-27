import { useMutation, useQueryClient } from "@tanstack/react-query";
import { homeDataKey } from "@/hooks/use-home-data";
import { joinClass } from "@/lib/actions/classes/join-class";

export const useJoinClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (code: string) => {
      return await joinClass(code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      queryClient.invalidateQueries({ queryKey: homeDataKey });
    },
  });
};
