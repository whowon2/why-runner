"use client";

import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useActionErrorMessage } from "@/hooks/use-action-error-message";
import { useAddCoTeacher } from "@/hooks/use-add-co-teacher";

/** Owner-level only: add an existing user as co-teacher by username or email. */
export function AddCoTeacherDialog({ classroomId }: { classroomId: string }) {
  const t = useTranslations("ClassesPage");
  const tCommon = useTranslations("Common");
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const { mutate: addCoTeacher, isPending } = useAddCoTeacher();
  const errorMessage = useActionErrorMessage();

  function handleAdd() {
    const trimmed = value.trim();
    if (!trimmed) return;
    addCoTeacher(
      { classroomId, usernameOrEmail: trimmed },
      {
        onError: (error) => toast.error(errorMessage(error)),
        onSuccess: () => {
          toast.success(t("addCoTeacherSuccess"));
          setOpen(false);
        },
      },
    );
  }

  return (
    <Dialog
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setValue("");
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <UserPlus className="size-4" />
          {t("addCoTeacher")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("addCoTeacherTitle")}</DialogTitle>
          <DialogDescription>{t("addCoTeacherDescription")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="co-teacher">{t("addCoTeacherLabel")}</Label>
          <Input
            id="co-teacher"
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder={t("addCoTeacherPlaceholder")}
            value={value}
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{tCommon("cancel")}</Button>
          </DialogClose>
          <Button disabled={isPending || !value.trim()} onClick={handleAdd}>
            <LoadingSwap isLoading={isPending}>
              {t("addCoTeacherSubmit")}
            </LoadingSwap>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
