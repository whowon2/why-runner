import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unwrap } from "@/lib/action-result";
import { cancelRun } from "@/lib/actions/runs/cancel-run";

/** Cancels a still-PENDING run; its `useRun` query then stops polling. */
export const useCancelRun = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (runId: string) => unwrap(await cancelRun(runId)),
    // Also on ALREADY_RUNNING: the run moved on, show its real status.
    onSettled: (_data, _error, runId) => {
      queryClient.invalidateQueries({ queryKey: ["code-run", runId] });
    },
  });
};
