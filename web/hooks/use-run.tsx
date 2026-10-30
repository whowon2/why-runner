import { useQuery } from "@tanstack/react-query";
import { getRun } from "@/lib/actions/runs/get-run";

/** A run's result, polled every second until the judge finishes it. */
export const useRun = (runId: string | null) =>
  useQuery({
    queryKey: ["code-run", runId],
    queryFn: () => getRun(runId as string),
    enabled: runId !== null,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === undefined ||
        status === "PENDING" ||
        status === "RUNNING"
        ? 1000
        : false;
    },
  });
