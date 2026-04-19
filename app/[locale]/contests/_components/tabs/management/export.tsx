"use client";

import { Download, Loader } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Contest } from "@/drizzle/schema";
import { exportContestData } from "@/lib/actions/contest/export-contest";

export function ExportContestData({ contest }: { contest: Contest }) {
  const [isPending, setIsPending] = useState(false);

  async function handleExport() {
    setIsPending(true);
    try {
      const csv = await exportContestData(contest.id);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${contest.name.replace(/\s+/g, "_")}_results.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Results exported");
    } catch (e) {
      toast.error("Export failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button onClick={handleExport} disabled={isPending} variant="outline">
      {isPending ? <Loader className="animate-spin" /> : <Download />}
      Export Results (CSV)
    </Button>
  );
}
