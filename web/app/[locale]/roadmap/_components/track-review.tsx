"use client";

import { ArrowLeft, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { useTrackReview } from "@/hooks/use-track-review";
import { cn } from "@/lib/utils";

export function TrackReview({ trackId }: { trackId: string }) {
  const t = useTranslations("RoadmapPage.Review");
  const { data, isPending } = useTrackReview(trackId);

  if (isPending) return <Skeleton className="h-96 w-full" />;
  if (!data) return null;

  const { track, students } = data;

  return (
    <div className="flex flex-col gap-6">
      <Button asChild className="w-fit px-0" variant="link">
        <Link href={`/roadmap/${trackId}`}>
          <ArrowLeft />
          {t("backToTrack")}
        </Link>
      </Button>

      <h1 className="font-bold text-2xl">
        {t("title", { track: track.title })}
      </h1>

      {students.length === 0 ? (
        <p className="text-muted-foreground">{t("noStudents")}</p>
      ) : (
        <Accordion
          className="flex w-full flex-col gap-2"
          collapsible
          type="single"
        >
          {students.map(({ student, submittedAt, answers }) => (
            <AccordionItem
              className="rounded-md border px-3"
              key={student.id}
              value={student.id}
            >
              <AccordionTrigger className="text-sm">
                <span>{student.name}</span>
                {submittedAt ? (
                  <Badge className="bg-blue-500">
                    {t("submittedAt", {
                      date: new Date(submittedAt).toLocaleString(),
                    })}
                  </Badge>
                ) : (
                  <Badge variant="outline">{t("notSubmitted")}</Badge>
                )}
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4">
                {answers.map((answer, idx) => (
                  <div className="flex flex-col gap-2" key={answer.lessonId}>
                    <h3 className="font-medium text-sm">
                      {idx + 1}. {answer.problem.title}
                    </h3>
                    {answer.submission ? (
                      <div className="relative">
                        <Badge
                          className={cn("absolute top-2 left-2", {
                            "bg-green-500":
                              answer.submission.status === "PASSED",
                          })}
                          variant={
                            answer.submission.status === "PASSED"
                              ? undefined
                              : "outline"
                          }
                        >
                          {answer.submission.status}
                        </Badge>
                        <Button
                          className="absolute top-2 right-2 size-7"
                          onClick={() => {
                            navigator.clipboard.writeText(
                              answer.submission?.code ?? "",
                            );
                            toast.success(t("copied"));
                          }}
                          size="icon"
                          variant="outline"
                        >
                          <Copy className="size-3.5" />
                        </Button>
                        <pre className="min-h-11 max-h-60 w-full overflow-auto whitespace-pre-wrap break-all rounded-md border bg-muted/50 p-2 pt-10 pr-10 font-mono text-xs text-foreground">
                          {answer.submission.code}
                        </pre>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-xs">
                        {t("noAnswer")}
                      </p>
                    )}
                  </div>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
