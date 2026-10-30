"use client";

import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { StatusBadge } from "@/components/submissions/status-badge";
import { SubmissionDetails } from "@/components/submissions/submission-details";
import { VisualAnswer } from "@/components/submissions/visual-answer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { statusTone } from "@/lib/submission-status";
import { cn } from "@/lib/utils";
import { AiHelpButton } from "./ai-help-button";
import { useWorkspace } from "./workspace-context";

/** The viewer's own submissions in this context, newest first. */
export function SubmissionHistory({ onLoaded }: { onLoaded?: () => void }) {
  const t = useTranslations("Workspace.History");
  const { source, canLoad, load } = useWorkspace();

  if (source.submissionsPending) return <Skeleton className="h-32 w-full" />;
  if (!source.submissions?.length) {
    return <p className="text-muted-foreground text-sm">{t("empty")}</p>;
  }

  return (
    <Accordion className="flex flex-col gap-2" collapsible type="single">
      {source.submissions.map((s) => (
        <AccordionItem
          className={cn("border px-3 last:border", statusTone(s.status))}
          key={s.id}
          value={s.id}
        >
          <AccordionTrigger className="gap-3 text-sm">
            <span className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1">
              <span>{s.createdAt.toLocaleString()}</span>
              <span className="text-muted-foreground text-xs">
                {s.language}
              </span>
              <span className="text-muted-foreground text-xs">
                {t("chars", { count: s.codeSize ?? s.code.length })}
              </span>
            </span>
            <StatusBadge status={s.status} />
          </AccordionTrigger>
          <AccordionContent className="flex flex-col gap-3">
            <div className="flex flex-wrap justify-end gap-2">
              <AiHelpButton submission={s} />
              {canLoad &&
                s.language &&
                (!s.editorMode || s.editorMode === "code") && (
                  <Button
                    onClick={() => {
                      if (s.language) load(s.language, s.code);
                      onLoaded?.();
                    }}
                    size="sm"
                    variant="outline"
                  >
                    <Download />
                    {t("load")}
                  </Button>
                )}
            </div>
            <VisualAnswer submission={s} />
            <pre
              className="notranslate max-h-60 overflow-auto border bg-muted/50 p-2 font-mono text-xs whitespace-pre"
              translate="no"
            >
              {s.code}
            </pre>
            {s.output && (
              <SubmissionDetails
                constraintViolationDetail={s.constraintViolationDetail}
                output={s.output}
                status={s.status}
              />
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
