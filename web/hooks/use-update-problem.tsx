import { useMutation } from "@tanstack/react-query";
import {
  type UpdateProblemInput,
  updateProblem,
} from "@/lib/actions/problems/update-problem";

export type { UpdateProblemInput };

export const useUpdateProblem = () =>
  useMutation({
    mutationFn: async (input: UpdateProblemInput) => {
      return await updateProblem(input);
    },
  });
