"use client";

import { Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { parseAsBoolean, useQueryState } from "nuqs";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { LoadingSwap } from "@/components/ui/loading-swap";
import { useCreateClass } from "@/hooks/use-create-class";
import { useRouter } from "@/i18n/navigation";

export function CreateClassButton() {
  const t = useTranslations("ClassesPage");
  const { mutateAsync: createClass, isPending } = useCreateClass();
  const router = useRouter();
  const [triggerFromQuery, setTriggerFromQuery] = useQueryState(
    "createClass",
    parseAsBoolean.withDefault(false),
  );
  const hasFiredFromQuery = useRef(false);

  // mutateAsync rather than mutate's callbacks: when fired from the mount
  // effect below, StrictMode's effect replay detaches the mutation observer
  // and the per-call onSuccess never runs.
  function handleCreate() {
    createClass()
      .then((data) => router.push(`/classes/${data.slug}`))
      .catch((error: Error) => toast.error(error.message));
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
