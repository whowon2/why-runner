import { useMutation } from "@tanstack/react-query";
import { updateProfile } from "@/lib/actions/update-profile";

export type UpdateProfileInput = {
  image: string;
  name: string;
};

export const useUpdateProfile = () =>
  useMutation({
    mutationFn: async (input: UpdateProfileInput) => {
      return await updateProfile(input);
    },
  });
