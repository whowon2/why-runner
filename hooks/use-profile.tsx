import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/lib/actions/get-profile";

export const useProfile = (userId: string) =>
  useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      return await getProfile(userId);
    },
  });
