"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { CreateContestForm } from "./form";

export function CreateContestDialog({
  refetchAction,
}: {
  refetchAction?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("ContestsPage.createDialog");

  return (
    <Dialog onOpenChange={setIsOpen} open={isOpen}>
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
