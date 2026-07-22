"use client";

import { useTranslations } from "next-intl";
import { parseAsBoolean, useQueryState } from "nuqs";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreateContestForm } from "./form";

export function CreateContestDialog({
  refetchAction,
}: {
  refetchAction?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [openFromQuery, setOpenFromQuery] = useQueryState(
    "createContest",
    parseAsBoolean.withDefault(false),
  );
  const t = useTranslations("ContestsPage.createDialog");

  function handleOpenChange(next: boolean) {
    setIsOpen(next);
    if (!next && openFromQuery) setOpenFromQuery(null);
  }

  return (
    <Dialog onOpenChange={handleOpenChange} open={isOpen || openFromQuery}>
      <DialogTrigger asChild={true}>
        <Button variant="outline">{t("button")}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
        </DialogHeader>
        <CreateContestForm
          onSuccessAction={() => {
            setIsOpen(false);
            refetchAction?.();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
