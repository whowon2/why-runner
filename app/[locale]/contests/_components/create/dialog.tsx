"use client";

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
import { authClient } from "@/lib/auth/client";
import { CreateContestForm } from "./form";

export function CreateContestDialog({
  refetchAction,
}: {
  refetchAction: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations("ContestsPage.createDialog");

  const { data: session } = authClient.useSession();

  if (!session) {
    return null;
  }

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
          session={session.session}
          onSuccessAction={() => {
            setIsOpen(false);
            refetchAction();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
