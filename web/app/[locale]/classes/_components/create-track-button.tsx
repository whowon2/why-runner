"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useCreateTrack } from "@/hooks/use-create-track";
import { useRouter } from "@/i18n/navigation";

export function CreateTrackButton({ classroomId }: { classroomId: string }) {
  const t = useTranslations("TracksPage");
  const { mutate: createTrack, isPending } = useCreateTrack();
  const router = useRouter();

  function handleCreate() {
    createTrack(
      { classroomId },
      {
        onError: (error: Error) => toast.error(error.message),
        onSuccess: (data) => router.push(`/roadmap/${data.id}`),
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
