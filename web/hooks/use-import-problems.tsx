import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importProblems } from "@/lib/actions/problems/import-problems";

export const useImportProblems = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: unknown) => importProblems(data),
    onSuccess: (result) => {
      if (result.ok) {
        queryClient.invalidateQueries({ queryKey: ["problems"] });
      }
    },
  });
};
