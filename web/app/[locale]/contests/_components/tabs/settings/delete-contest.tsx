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
import { useDeleteContest } from "@/hooks/use-delete-contest";
import { useRouter } from "@/i18n/navigation";

export function DeleteContest({ contestId }: { contestId: string }) {
  const t = useTranslations("ContestsPage.Tabs.Settings.DeleteContest");
  const { mutate: deleteContest, isPending } = useDeleteContest();
  const router = useRouter();

  function handleDelete() {
    deleteContest(contestId, {
      onError(error) {
        toast.error(t("error"), { description: error.message });
      },
      onSuccess() {
        toast.success(t("success"));
        router.push("/contests");
      },
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={isPending}>
          <LoadingSwap
            isLoading={isPending}
            className="inline-flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {t("button")}
          </LoadingSwap>
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("dialogTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("dialogDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>
            {t("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
