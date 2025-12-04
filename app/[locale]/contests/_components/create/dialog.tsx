"use client";

import type { User } from "better-auth";
import { useTranslations } from "next-intl";
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
  user,
  refetchAction,
}: {
  user: User;
  refetchAction: () => void;
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
          user={user}
          onSuccessAction={() => {
            setIsOpen(false);
            refetchAction();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
