import { useQuery } from "@tanstack/react-query";
import { getProblems } from "@/lib/actions/problems/get-problems";

export const useProblems = () =>
  useQuery({
    queryKey: ["problems"],
    queryFn: async () => {
      return await getProblems();
    },
  });
