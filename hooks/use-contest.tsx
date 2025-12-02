import { useQuery } from "@tanstack/react-query";
import { getContest } from "@/lib/actions/contest/get-contest-by-id";

export const useContest = (contestId: number) =>
  useQuery({
    queryKey: ["contest", contestId],
    queryFn: async () => {
      console.log("Fetching contest:", contestId);
      return await getContest(contestId);
    },
  });
