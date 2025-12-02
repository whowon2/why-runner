import { useQuery } from "@tanstack/react-query";
import { getContestSubmissions } from "@/lib/actions/contest/get-submissions";

export const useProblemSubmissions = (input: { problemId: number }) =>
  useQuery({
    queryKey: ["submissions", String(input.problemId)],
    queryFn: async () => {
      console.log("Fetching submissions");
      return await getContestSubmissions(input.problemId);
    },
  });
