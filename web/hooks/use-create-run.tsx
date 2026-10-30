import { useMutation } from "@tanstack/react-query";
import { unwrap } from "@/lib/action-result";
import { type CreateRunInput, createRun } from "@/lib/actions/runs/create-run";

// Runs feed no other view (they never count as submissions), so there is
// nothing to invalidate: the new run is read through `useRun(id)`.
export const useCreateRun = () =>
  useMutation({
    mutationFn: async (input: CreateRunInput) => unwrap(await createRun(input)),
  });
