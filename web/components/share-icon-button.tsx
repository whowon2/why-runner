"use client";

import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ShareIconButton({
  path,
  title,
}: {
  path: string;
  title?: string;
}) {
  const t = useTranslations("Share");

  async function handleShare() {
    const url = `${window.location.origin}${path}`;

    if (navigator.share) {
      try {
        await navigator.share({ url, title });
        return;
      } catch {
        // user cancelled or share failed, fall back to copy
      }
    }

    await navigator.clipboard.writeText(url);
    toast.success(t("linkCopied"));
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleShare}
      title={t("share")}
    >
      <Share2 className="h-4 w-4" />
    </Button>
  );
}
