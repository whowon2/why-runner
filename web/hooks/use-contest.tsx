import { useQuery } from "@tanstack/react-query";
import { getContest } from "@/lib/actions/contest/get-contest-by-id";

export const useContest = (contestId: string) =>
  useQuery({
    queryKey: ["contest", contestId],
    queryFn: async () => await getContest(contestId),
  });
