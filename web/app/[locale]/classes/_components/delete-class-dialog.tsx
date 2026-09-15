"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useDeleteClass } from "@/hooks/use-delete-class";
import { useRouter } from "@/i18n/navigation";

export function DeleteClassDialog({ classroomId }: { classroomId: string }) {
  const t = useTranslations("ClassesPage");
  const tCommon = useTranslations("Common");
  const { mutate: deleteClass, isPending } = useDeleteClass();
  const router = useRouter();

  function handleDelete() {
    deleteClass(classroomId, {
      onError: (error: Error) => toast.error(error.message),
      onSuccess: () => {
        toast.success(t("deleteClassSuccess"));
        router.push("/classes");
      },
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={isPending} variant="destructive">
          <LoadingSwap
            className="inline-flex items-center gap-2"
            isLoading={isPending}
          >
            <Trash2 className="size-4" />
            {t("deleteClass")}
          </LoadingSwap>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteClassTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteClassDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>
            {tCommon("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
