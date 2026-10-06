"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { Textarea } from "@/components/ui/textarea";
import { useCreateLesson } from "@/hooks/use-create-lesson";
import { useRouter } from "@/i18n/navigation";
import { LESSON_TITLE_MAX_LENGTH } from "@/lib/actions/lessons/lesson-title";

export function CreateLessonButton({
  classroomId,
  classSlug,
}: {
  classroomId: string;
  classSlug: string;
}) {
  const t = useTranslations("TracksPage");
  const tCommon = useTranslations("Common");
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const { mutate: createLesson, isPending } = useCreateLesson();
  const router = useRouter();

  function handleCreate() {
    const trimmed = title.trim();
    if (!trimmed) return;
    createLesson(
      { classroomId, title: trimmed, description: description.trim() },
      {
        onError: (error: Error) => toast.error(error.message),
        onSuccess: (data) =>
          router.push(`/classes/${classSlug}/lessons/${data.slug}`),
      },
    );
  }

  return (
    <Dialog
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setTitle("");
          setDescription("");
        }
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Plus className="h-4 w-4" />
          {t("createTrack")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("createTrack")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="lesson-title">{t("titleLabel")}</Label>
            <Input
              autoFocus
              id="lesson-title"
              maxLength={LESSON_TITLE_MAX_LENGTH}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              placeholder={t("titlePlaceholder")}
              value={title}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="lesson-description">{t("descriptionLabel")}</Label>
            <Textarea
              id="lesson-description"
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              value={description}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{tCommon("cancel")}</Button>
          </DialogClose>
          <Button disabled={isPending || !title.trim()} onClick={handleCreate}>
            <LoadingSwap isLoading={isPending}>{t("create")}</LoadingSwap>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
