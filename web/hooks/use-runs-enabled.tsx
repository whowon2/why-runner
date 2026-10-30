import { useQuery } from "@tanstack/react-query";
import { getRunsEnabled } from "@/lib/actions/runs/get-runs-enabled";

/** The `CUSTOM_RUN_ENABLED` deploy gate, fetched once per session. */
export const useRunsEnabled = () =>
  useQuery({
    queryKey: ["runs-enabled"],
    queryFn: () => getRunsEnabled(),
    staleTime: Number.POSITIVE_INFINITY,
  }).data === true;
