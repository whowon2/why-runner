import { useQuery } from "@tanstack/react-query";
import { getSubmissions } from "@/lib/actions/contest/get-submissions";

export const useSubmissions = (contestId: number) =>
  useQuery({
    queryKey: ["contests", contestId],
    queryFn: async () => {
      console.log("Fetching submissions:", contestId);
      return await getSubmissions(contestId);
    },
  });
