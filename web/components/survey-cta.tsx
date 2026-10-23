"use client";

import { ClipboardList, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useSurveyCta } from "@/hooks/use-surveys";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

const dismissKey = (kind: string, entityId: string) =>
  `survey-cta-dismissed:${kind}:${entityId}`;

/**
 * Invites the current user to the evaluation survey for this contest or
 * lesson when `getSurveyCta` says they're eligible and haven't answered.
 * "Agora não" hides it for the browser session only.
 */
export function SurveyCta({
  kind,
  entityId,
  className,
}: {
  kind: "contest" | "lesson";
  entityId: string;
  className?: string;
}) {
  const t = useTranslations("Surveys.cta");
  const { data: cta } = useSurveyCta(kind, entityId);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(dismissKey(kind, entityId)) === "1");
    } catch {
      setDismissed(false);
    }
  }, [kind, entityId]);

  if (!cta || dismissed) return null;

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(dismissKey(kind, entityId), "1");
    } catch {}
  };

  return (
    <aside
      className={cn(
        "flex w-full flex-col gap-3 border border-primary/40 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span className="border bg-primary/10 p-2">
          <ClipboardList className="size-5 text-primary" />
        </span>
        <div className="space-y-1">
          <p className="font-semibold">{t("title")}</p>
          <p className="text-sm text-muted-foreground">{t(kind)}</p>
        </div>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="ghost" onClick={dismiss}>
          <X />
          {t("dismiss")}
        </Button>
        <Button asChild>
          <Link href={`/surveys/${cta.form}/${cta.entityId}`}>
            {t("button")}
          </Link>
        </Button>
      </div>
    </aside>
  );
}
