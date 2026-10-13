"use client";

import { Download, Loader } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Contest } from "@/drizzle/schema";
import { exportContestData } from "@/lib/actions/contest/export-contest";

export function ExportContestData({ contest }: { contest: Contest }) {
  const t = useTranslations("ContestsPage.Tabs.Management.Export");
  const [isPending, setIsPending] = useState(false);

  async function handleExport() {
    setIsPending(true);
    try {
      const base64 = await exportContestData(contest.id);
      const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
      const blob = new Blob([bytes], { type: "application/zip" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${contest.slug}-export.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("success"));
    } catch (e) {
      toast.error(t("failed"), {
        description: e instanceof Error ? e.message : t("unknownError"),
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Button onClick={handleExport} disabled={isPending} variant="outline">
      {isPending ? <Loader className="animate-spin" /> : <Download />}
      {t("button")}
    </Button>
  );
}
