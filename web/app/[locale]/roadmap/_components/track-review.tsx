"use client";

import { ArrowLeft, Clock, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { useReviewTrackSubmission } from "@/hooks/use-review-track-submission";
import { useTrackReview } from "@/hooks/use-track-review";
import { cn } from "@/lib/utils";

export function TrackReview({ trackId }: { trackId: string }) {
  const t = useTranslations("RoadmapPage.Review");
  const { data, isPending, isError, error } = useTrackReview(trackId);

  if (isPending) return <Skeleton className="h-96 w-full" />;

  if (isError) {
    const notYetAvailable = error.message === "REVIEW_NOT_YET_AVAILABLE";
    return (
      <div className="flex flex-col gap-6">
        <Button asChild className="w-fit px-0" variant="link">
          <Link href={`/roadmap/${trackId}`}>
            <ArrowLeft />
            {t("backToTrack")}
          </Link>
        </Button>
        <div className="flex flex-col items-center gap-2 rounded-md border py-12 text-center text-muted-foreground">
          <Clock className="size-6" />
          <p>{notYetAvailable ? t("notYetAvailable") : error.message}</p>
        </div>
      </div>
    );
  }

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
          {students.map(({ student, submittedAt, reviewedAt, score, answers }) => (
            <AccordionItem
              className="rounded-md border px-3"
              key={student.id}
              value={student.id}
            >
              <AccordionTrigger className="text-sm">
                <span>{student.name}</span>
                <div className="flex items-center gap-2">
                  {submittedAt ? (
                    <Badge className="bg-blue-500">
                      {t("submittedAt", {
                        date: new Date(submittedAt).toLocaleString(),
                      })}
                    </Badge>
                  ) : (
                    <Badge variant="outline">{t("notSubmitted")}</Badge>
                  )}
                  {reviewedAt && score !== null && (
                    <Badge className="bg-green-600">
                      {t("scoreLabel", { score })}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-4">
                {submittedAt && (
                  <ReviewScoreForm
                    reviewedAt={reviewedAt}
                    score={score}
                    trackId={trackId}
                    userId={student.id}
                  />
                )}
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

function ReviewScoreForm({
  trackId,
  userId,
  score,
  reviewedAt,
}: {
  trackId: string;
  userId: string;
  score: number | null;
  reviewedAt: Date | null;
}) {
  const t = useTranslations("RoadmapPage.Review");
  const { mutate: review, isPending } = useReviewTrackSubmission();
  const [value, setValue] = useState(score !== null ? String(score) : "");

  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/30 p-2">
      <Input
        className="w-24"
        onChange={(e) => setValue(e.target.value)}
        placeholder={t("scorePlaceholder")}
        type="number"
        value={value}
      />
      <Button
        disabled={isPending || value.trim() === ""}
        onClick={() =>
          review(
            { trackId, userId, score: Number(value) },
            {
              onError: (error) => toast.error(error.message),
              onSuccess: () => toast.success(t("reviewSaved")),
            },
          )
        }
        size="sm"
      >
        {reviewedAt ? t("updateScore") : t("markReviewed")}
      </Button>
      {reviewedAt && (
        <span className="text-muted-foreground text-xs">
          {t("reviewedAt", { date: new Date(reviewedAt).toLocaleString() })}
        </span>
      )}
    </div>
  );
}
