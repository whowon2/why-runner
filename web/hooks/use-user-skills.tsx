import { useQuery } from "@tanstack/react-query";
import { getUserSkills } from "@/lib/actions/lessons/get-user-skills";

export const useUserSkills = (userId: string) =>
  useQuery({
    queryKey: ["skills", userId],
    queryFn: () => getUserSkills(userId),
  });
