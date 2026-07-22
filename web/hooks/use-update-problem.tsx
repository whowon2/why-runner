import { useMutation } from "@tanstack/react-query";
import type { Problem } from "@/drizzle/schema";
import { updateProblem } from "@/lib/actions/problems/update-problem";

export type UpdateProblemInput = {
  problemId: string;
  problem: Partial<Problem>;
};

export const useUpdateProblem = () =>
  useMutation({
    mutationFn: async (input: UpdateProblemInput) => {
      return await updateProblem(input);
    },
  });
