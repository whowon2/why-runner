"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useCreateProblem } from "@/hooks/use-create-problem";
import { useRouter } from "@/i18n/navigation";

export function CreateProblemButton() {
  const t = useTranslations("ProblemsPage");
  const { mutate: createProblem, isPending } = useCreateProblem();
  const router = useRouter();

  function handleCreate() {
    createProblem(undefined, {
      onError: (error) => {
        toast.error(t("failedCreateDraft"), { description: error.message });
      },
      onSuccess: (data) => {
        router.push(`/problems/${data.slug}?tab=edit`);
      },
    });
  }

  return (
    <Button variant="outline" disabled={isPending} onClick={handleCreate}>
      <LoadingSwap
        isLoading={isPending}
        className="inline-flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        {t("Create.button")}
      </LoadingSwap>
    </Button>
  );
}
