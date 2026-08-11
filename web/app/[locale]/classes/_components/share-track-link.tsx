"use client";

import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useClass } from "@/hooks/use-class";

export function ShareTrackLink({ classroomId }: { classroomId: string }) {
  const t = useTranslations("TracksPage");
  const { data } = useClass(classroomId);

  if (!data) return null;

  function handleShare() {
    const url = `${window.location.origin}/classes/join/${data?.classroom.joinCode}`;
    navigator.clipboard.writeText(url);
    toast.success(t("linkCopied"));
  }

  return (
    <Button onClick={handleShare} size="sm" variant="outline">
      <Share2 className="size-3.5" />
      {t("shareWithStudents")}
    </Button>
  );
}
