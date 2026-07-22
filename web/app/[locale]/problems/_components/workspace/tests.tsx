"use client";

import { Download, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProblemTests } from "@/hooks/use-problem-tests";

export function ProblemTestsTab({ problemId }: { problemId: string }) {
  const t = useTranslations("ProblemsPage.Workspace.Tests");
  const { data, isPending } = useProblemTests(problemId);

  if (isPending || !data) {
    return <Skeleton className="h-40 w-full" />;
  }

  async function handleDownload() {
    if (!data?.all) return;

    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    data.all.forEach((testCase, i) => {
      const n = i + 1;
      zip.file(`input${n}.txt`, testCase.input);
      zip.file(`output${n}.txt`, testCase.output);
    });

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tests.zip";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-2 font-semibold text-lg">{t("sampleTitle")}</h2>
        <div className="space-y-4">
          {data.samples.map((testCase, i) => (
            <div className="flex gap-4" key={`sample-${i}-${testCase.input}`}>
              <div className="w-full">
                <span className="font-medium">{t("input")}:</span>
                <pre className="mt-1 rounded-none border p-2">
                  {testCase.input}
                </pre>
              </div>
              <div className="w-full">
                <span className="font-medium">{t("output")}:</span>
                <pre className="mt-1 rounded-none border p-2">
                  {testCase.output}
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-2 font-semibold text-lg">{t("fullTitle")}</h2>
        {data.all ? (
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4" />
            {t("download")}
          </Button>
        ) : (
          <div className="flex items-center gap-2 rounded-lg border border-dashed p-4 text-muted-foreground text-sm">
            <Lock className="h-4 w-4" />
            {t("locked")}
          </div>
        )}
      </div>
    </div>
  );
}
