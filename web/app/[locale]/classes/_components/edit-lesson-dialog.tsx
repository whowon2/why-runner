"use client";

import { Pencil } from "lucide-react";
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
import { useUpdateLesson } from "@/hooks/use-update-lesson";
import { LESSON_TITLE_MAX_LENGTH } from "@/lib/actions/lessons/lesson-title";

export function EditLessonDialog({
  lessonId,
  title,
  description,
}: {
  lessonId: string;
  title: string;
  description: string;
}) {
  const t = useTranslations("TracksPage");
  const tCommon = useTranslations("Common");
  const [open, setOpen] = useState(false);
  const [titleValue, setTitleValue] = useState(title);
  const [descriptionValue, setDescriptionValue] = useState(description);
  const { mutate: updateLesson, isPending } = useUpdateLesson();

  function handleSave() {
    const nextTitle = titleValue.trim();
    const nextDescription = descriptionValue.trim();
    if (!nextTitle) return;

    const changes = {
      ...(nextTitle !== title ? { title: nextTitle } : {}),
      ...(nextDescription !== description
        ? { description: nextDescription }
        : {}),
    };
    if (Object.keys(changes).length === 0) {
      setOpen(false);
      return;
    }

    updateLesson(
      { lessonId, ...changes },
      {
        onError: (error: Error) => toast.error(error.message),
        onSuccess: () => setOpen(false),
      },
    );
  }

  return (
    <Dialog
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setTitleValue(title);
          setDescriptionValue(description);
        }
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="size-3.5" />
          {t("editTrack")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editTrack")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-lesson-title">{t("titleLabel")}</Label>
            <Input
              id="edit-lesson-title"
              maxLength={LESSON_TITLE_MAX_LENGTH}
              onChange={(e) => setTitleValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              placeholder={t("titlePlaceholder")}
              value={titleValue}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-lesson-description">
              {t("descriptionLabel")}
            </Label>
            <Textarea
              id="edit-lesson-description"
              onChange={(e) => setDescriptionValue(e.target.value)}
              placeholder={t("descriptionPlaceholder")}
              value={descriptionValue}
            />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{tCommon("cancel")}</Button>
          </DialogClose>
          <Button
            disabled={isPending || !titleValue.trim()}
            onClick={handleSave}
          >
            <LoadingSwap isLoading={isPending}>
              {tCommon("confirm")}
            </LoadingSwap>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
