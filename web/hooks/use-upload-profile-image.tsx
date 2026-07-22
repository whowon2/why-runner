import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadProfileImage } from "@/lib/actions/upload-profile-image";

export const useUploadProfileImage = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => uploadProfileImage(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });
};
