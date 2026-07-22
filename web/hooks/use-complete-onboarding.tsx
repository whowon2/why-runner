import { useMutation } from "@tanstack/react-query";
import { completeOnboarding } from "@/lib/actions/onboarding/complete-onboarding";

export const useCompleteOnboarding = () =>
  useMutation({
    mutationFn: async (username: string) => {
      return await completeOnboarding(username);
    },
  });
