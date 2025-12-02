"use client";

import { Brain } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Problem, Submission } from "@/lib/db/schema";
import { useAIHelp } from "@/hooks/use-ai-help";

export function AIDialog({
  submission,
  problem,
}: {
  submission: Submission;
  problem: Problem;
}) {
  const { mutate, isPending } = useAIHelp();

  const [help, setHelp] = useState(() => {
    if (typeof window !== "undefined") {
      return window.localStorage.getItem(`ai-help-${submission.id}`) ?? "";
    }
    return "";
  });
  const locale = useLocale();
  const t = useTranslations("ContestsPage.Tabs.Problem.Submissions.AI");

  // This effect will sync the state if localStorage changes from another tab,
  // though its primary role here is to load data on mount on the client-side.
  useEffect(() => {
    const savedHelp = window.localStorage.getItem(`ai-help-${submission.id}`);
    if (savedHelp) {
      setHelp(savedHelp);
    }
  }, [submission.id]);

  function handle() {
    // Prevent new requests if help already exists
    if (help) return;

    mutate(
      { problem, submission, locale },
      {
        onError: (e) => {
          console.error("error", e);
          // Optional: Display an error message to the user
          setHelp(t("error"));
        },
        onSuccess: (data) => {
          const helpText = data ?? t("noResponse"); // Use a translation for empty response
          console.log("success", data);
          setHelp(helpText);
          // Save the successful response to localStorage
          window.localStorage.setItem(`ai-help-${submission.id}`, helpText);
        },
      },
    );
  }

  return (
    <Dialog>
      <DialogTrigger>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="border cursor-pointer hover:bg-secondary px-2 py-2 rounded">
              <Brain className="h-4 w-4" />
            </div>
          </TooltipTrigger>
          <TooltipContent>{t("help")}</TooltipContent>
        </Tooltip>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="text-sm py-4 whitespace-pre-wrap">
          {isPending ? t("loading") : <ReactMarkdown>{help}</ReactMarkdown>}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{t("cancel")}</Button>
          </DialogClose>
          {/* Disable button if a request is pending OR if help text already exists */}
          <Button onClick={handle} disabled={isPending || !!help}>
            {t("request")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
