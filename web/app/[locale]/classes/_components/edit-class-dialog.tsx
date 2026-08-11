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
import { useUpdateClass } from "@/hooks/use-update-class";

export function EditClassDialog({
  classroomId,
  name,
}: {
  classroomId: string;
  name: string;
}) {
  const t = useTranslations("ClassesPage");
  const tCommon = useTranslations("Common");
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(name);
  const { mutate: updateClass, isPending } = useUpdateClass();

  function handleSave() {
    const trimmed = value.trim();
    if (!trimmed) return;
    updateClass(
      { classroomId, name: trimmed },
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
        if (next) setValue(name);
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil className="size-4" />
          {t("editClass")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("editClass")}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="class-name">{t("classNameLabel")}</Label>
          <Input
            id="class-name"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            value={value}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{tCommon("cancel")}</Button>
          </DialogClose>
          <Button disabled={isPending || !value.trim()} onClick={handleSave}>
            <LoadingSwap isLoading={isPending}>
              {tCommon("confirm")}
            </LoadingSwap>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
