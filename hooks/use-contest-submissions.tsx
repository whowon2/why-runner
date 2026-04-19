import { useQuery } from "@tanstack/react-query";
import { getContestSubmissions } from "@/lib/actions/contest/get-submissions";

export const useContestSubmissions = (input: { contestId: string }) =>
  useQuery({
    queryKey: ["submissions", input],
    queryFn: () => getContestSubmissions(input),
  });
