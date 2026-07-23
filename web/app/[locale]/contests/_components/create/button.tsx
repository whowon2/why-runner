"use client";

import { Plus } from "lucide-react";
import { parseAsBoolean, useQueryState } from "nuqs";
import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useCreateContest } from "@/hooks/use-create-contest";
import { useRouter } from "@/i18n/navigation";

export function CreateContestButton() {
  const t = useTranslations("ContestsPage.createDialog");
  const { mutate: createContest, isPending } = useCreateContest();
  const router = useRouter();
  const [triggerFromQuery, setTriggerFromQuery] = useQueryState(
    "createContest",
    parseAsBoolean.withDefault(false),
  );
  const hasFiredFromQuery = useRef(false);

  function handleCreate() {
    createContest(undefined, {
      onError: (error) => {
        toast.error(t("failedCreate"), { description: error.message });
      },
      onSuccess: (data) => {
        router.push(`/contests/${data.slug}?tab=settings`);
      },
    });
  }

  useEffect(() => {
    if (triggerFromQuery && !hasFiredFromQuery.current) {
      hasFiredFromQuery.current = true;
      setTriggerFromQuery(null);
      handleCreate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerFromQuery]);

  return (
    <Button variant="outline" disabled={isPending} onClick={handleCreate}>
      <LoadingSwap
        isLoading={isPending}
        className="inline-flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        {t("button")}
      </LoadingSwap>
    </Button>
  );
}
