"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useCreateClass } from "@/hooks/use-create-class";
import { useRouter } from "@/i18n/navigation";

export function CreateClassButton() {
  const t = useTranslations("ClassesPage");
  const { mutate: createClass, isPending } = useCreateClass();
  const router = useRouter();

  function handleCreate() {
    createClass(undefined, {
      onError: (error: Error) => toast.error(error.message),
      onSuccess: (data) => {
        router.push(`/classes/${data.id}`);
      },
    });
  }

  return (
    <Button disabled={isPending} onClick={handleCreate} variant="outline">
      <LoadingSwap
        className="inline-flex items-center gap-2"
        isLoading={isPending}
      >
        <Plus className="h-4 w-4" />
        {t("createClass")}
      </LoadingSwap>
    </Button>
  );
}
