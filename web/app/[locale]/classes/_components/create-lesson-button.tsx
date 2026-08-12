"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useCreateLesson } from "@/hooks/use-create-lesson";
import { useRouter } from "@/i18n/navigation";

export function CreateLessonButton({
  classroomId,
  classSlug,
}: {
  classroomId: string;
  classSlug: string;
}) {
  const t = useTranslations("TracksPage");
  const { mutate: createLesson, isPending } = useCreateLesson();
  const router = useRouter();

  function handleCreate() {
    createLesson(
      { classroomId },
      {
        onError: (error: Error) => toast.error(error.message),
        onSuccess: (data) =>
          router.push(`/classes/${classSlug}/lessons/${data.slug}`),
      },
    );
  }

  return (
    <Button disabled={isPending} onClick={handleCreate} variant="outline">
      <LoadingSwap
        className="inline-flex items-center gap-2"
        isLoading={isPending}
      >
        <Plus className="h-4 w-4" />
        {t("createTrack")}
      </LoadingSwap>
    </Button>
  );
}
