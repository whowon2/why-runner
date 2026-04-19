import { useQuery } from "@tanstack/react-query";
import { getUserSubmissions } from "@/lib/actions/get-user-submissions";

export const useUserSubmissions = () =>
  useQuery({
    queryKey: ["submissions", "me"],
    queryFn: () => getUserSubmissions(),
  });
