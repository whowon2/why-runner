"use client";

import { type FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useJoinClass } from "@/hooks/use-join-class";
import { useRouter } from "@/i18n/navigation";

export function JoinClassForm() {
  const t = useTranslations("ClassesPage");
  const [code, setCode] = useState("");
  const { mutate: joinClass, isPending } = useJoinClass();
  const router = useRouter();

  function handleJoin(e: FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    joinClass(code, {
      onError: () => toast.error(t("joinFailed")),
      onSuccess: (data) => {
        router.push(`/classes/${data.id}`);
      },
    });
  }

  return (
    <form className="flex items-center gap-2" onSubmit={handleJoin}>
      <Input
        onChange={(e) => setCode(e.target.value)}
        placeholder={t("joinCodePlaceholder")}
        value={code}
      />
      <Button disabled={isPending || !code.trim()} type="submit">
        {t("join")}
      </Button>
    </form>
  );
}
