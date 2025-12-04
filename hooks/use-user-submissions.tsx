import { useQuery } from "@tanstack/react-query";
import { getUserSubmissions } from "@/lib/actions/get-user-submissions";

export const useUserSubmissions = (input: { userId: string }) =>
  useQuery({
    queryKey: ["submissions", input],
    queryFn: async () => {
      console.log("Fetching submissions");
      return await getUserSubmissions(input);
    },
  });
