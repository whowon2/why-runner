import { useMutation } from "@tanstack/react-query";
import { type GetAIHelpInput, getAIHelp } from "@/lib/actions/get-ai-help";

export const useAIHelp = () =>
  useMutation({
    mutationFn: async (input: GetAIHelpInput) => {
      return await getAIHelp(input);
    },
  });
