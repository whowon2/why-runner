import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClass } from "@/lib/actions/classes/create-class";

export const useCreateClass = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return await createClass();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classes"] });
    },
  });
};
