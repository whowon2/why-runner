import { useMutation } from "@tanstack/react-query";
import { unwrap } from "@/lib/action-result";
import { type GetAIHelpInput, getAIHelp } from "@/lib/actions/get-ai-help";

export const useAIHelp = () =>
  useMutation({
    mutationFn: async (input: GetAIHelpInput) => {
      return unwrap(await getAIHelp(input));
    },
  });
