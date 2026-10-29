import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { Language } from "@/drizzle/schema";
import { getStarterCode, type StarterComments } from "@/lib/starter-code";

// Starter-template comments in the current UI locale.
export function useStarterComments(): StarterComments {
  const t = useTranslations("StarterCode");
  return useMemo(() => ({ read: t("read"), write: t("write") }), [t]);
}

export function ResetCodeButton({
  language,
  code,
  onReset,
  onUndo,
}: {
  language: Language | null;
  code: string;
  onReset: (starter: string) => void;
  onUndo: (previous: string) => void;
}) {
  const t = useTranslations("StarterCode");
  const comments = useStarterComments();

  function handleReset() {
    if (!language) return;
    const starter = getStarterCode(language, comments);
    if (code === starter) return;
    const previous = code;
    onReset(starter);
    toast(t("resetDone"), {
      action: { label: t("undo"), onClick: () => onUndo(previous) },
      duration: 8000,
    });
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            aria-label={t("reset")}
            disabled={!language}
            onClick={handleReset}
            variant="outline"
          >
            <RotateCcw />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t("reset")}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
