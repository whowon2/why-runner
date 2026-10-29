import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unwrap } from "@/lib/action-result";
import { updateProfile } from "@/lib/actions/update-profile";

export type UpdateProfileInput = {
  username: string;
  ra?: string;
  bio?: string;
  location?: string;
  website?: string;
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      return unwrap(await updateProfile(input));
    },
    onSuccess: () => {
      // Username (in profile links) and RA also show outside the profile:
      // class rosters and gradebooks, problem and contest creators.
      for (const key of [
        "profile",
        "classes",
        "problems",
        "contests",
        "contest",
      ]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });
};
