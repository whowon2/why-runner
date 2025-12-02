import { useQuery } from "@tanstack/react-query";
import { getContestSubmissions } from "@/lib/actions/contest/get-submissions";

export const useContestSubmissions = (input: { contestId: number }) =>
  useQuery({
    queryKey: ["submissions"],
    queryFn: async () => {
      console.log("Fetching submissions");
      return await getContestSubmissions(input.contestId);
    },
  });
