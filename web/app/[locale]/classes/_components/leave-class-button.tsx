"use client";

import { LogOut } from "lucide-react";
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
import { useLeaveClass } from "@/hooks/use-leave-class";
import { useRouter } from "@/i18n/navigation";

export function LeaveClassButton({ classroomId }: { classroomId: string }) {
  const t = useTranslations("ClassesPage");
  const tCommon = useTranslations("Common");
  const { mutate: leaveClass, isPending } = useLeaveClass();
  const router = useRouter();

  function handleLeave() {
    leaveClass(classroomId, {
      onError: (error: Error) => toast.error(error.message),
      onSuccess: () => {
        toast.success(t("leaveClassSuccess"));
        router.push("/classes");
      },
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={isPending} variant="outline">
          <LoadingSwap
            className="inline-flex items-center gap-2"
            isLoading={isPending}
          >
            <LogOut className="size-4" />
            {t("leaveClass")}
          </LoadingSwap>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("leaveClassTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("leaveClassDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleLeave}>
            {tCommon("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
