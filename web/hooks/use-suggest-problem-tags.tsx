import { useMutation } from "@tanstack/react-query";
import {
  type SuggestProblemTagsInput,
  suggestProblemTags,
} from "@/lib/actions/problems/suggest-problem-tags";

// Read-only: the suggestion only pre-fills the edit form, nothing is
// persisted until the form is saved, so there's no query to invalidate.
export const useSuggestProblemTags = () =>
  useMutation({
    mutationFn: async (input: SuggestProblemTagsInput) => {
      return await suggestProblemTags(input);
    },
  });
