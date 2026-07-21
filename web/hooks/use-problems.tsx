import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  type GetProblemsParams,
  getProblems,
} from "@/lib/actions/problems/get-problems";

export const useProblems = (params: GetProblemsParams) =>
  useQuery({
    // Include all params in the key so it refetches on change
    queryKey: ["problems", params],
    queryFn: async () => {
      return await getProblems(params);
    },
    // This keeps the old data visible while the new page is loading (prevents flickering)
    placeholderData: keepPreviousData,
  });
