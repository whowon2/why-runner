"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  /** Explicit parent route, so it works on direct links (no history). */
  href: string;
  className?: string;
}

export function BackButton({ href, className }: BackButtonProps) {
  const t = useTranslations("Common");
  const label = t("back");

  return (
    <Button
      asChild
      className={cn("shrink-0", className)}
      size="icon"
      variant="ghost"
    >
      <Link aria-label={label} href={href} title={label}>
        <ArrowLeft className="size-5" />
      </Link>
    </Button>
  );
}
