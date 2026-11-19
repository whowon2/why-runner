import { Hourglass, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Shown in place of a spinner once a judge result has been pending for five
 * minutes and polling stopped (`judge-result-polling`). Check again refetches
 * once; `children` holds extra actions such as Cancel. `compact` keeps only
 * the icon buttons, for one-line toolbars.
 */
export function StillJudging({
  onCheck,
  checking,
  compact = false,
  className,
  children,
}: {
  onCheck: () => void;
  checking: boolean;
  compact?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const t = useTranslations("JudgePoll");

  return (
    <span
      className={cn(
        "flex flex-wrap items-center gap-2 text-muted-foreground text-sm",
        className,
      )}
      data-testid="still-judging"
      role="status"
      title={compact ? t("stillJudging") : undefined}
    >
      <Hourglass className="size-4 shrink-0" />
      {!compact && <span>{t("stillJudging")}</span>}
      <Button
        disabled={checking}
        onClick={onCheck}
        size={compact ? "icon-sm" : "sm"}
        title={t("checkAgain")}
        type="button"
        variant="outline"
      >
        <RefreshCw className={cn(checking && "animate-spin")} />
        {compact ? (
          <span className="sr-only">{t("checkAgain")}</span>
        ) : (
          t("checkAgain")
        )}
      </Button>
      {children}
    </span>
  );
}
