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
import type { Problem } from "@/drizzle/schema";
import { useDeleteProblem } from "@/hooks/use-delete-problem";
import { useRouter } from "@/i18n/navigation";

export function DeleteProblemButton({ problem }: { problem: Problem }) {
  const t = useTranslations("ProblemsPage.Delete");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const { mutate: deleteProblem, isPending } = useDeleteProblem();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button disabled={isPending} variant="destructive">
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
          <AlertDialogTitle>{t("title")}</AlertDialogTitle>
          <AlertDialogDescription>{t("description")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            onClick={() =>
              deleteProblem(problem.id, {
                onError: (error) =>
                  toast.error(t("failed"), { description: error.message }),
                onSuccess: () => {
                  toast.success(t("success"));
                  router.push("/problems");
                },
              })
            }
          >
            {tCommon("confirm")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
