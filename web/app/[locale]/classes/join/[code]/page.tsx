"use client";

import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { use } from "react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useJoinClass } from "@/hooks/use-join-class";
import { useRouter } from "@/i18n/navigation";

export default function JoinClassPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const t = useTranslations("ClassesPage");
  const router = useRouter();
  const { mutate: joinClass } = useJoinClass();
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;
    hasFired.current = true;

    joinClass(code, {
      onSuccess: (data) => {
        router.replace(`/classes/${data.id}`);
      },
      onError: () => {
        toast.error(t("joinFailed"));
        router.replace("/classes");
      },
    });
  }, [code, joinClass, router, t]);

  return (
    <div className="flex w-full flex-col flex-1 items-center gap-4 p-4">
      <div className="flex w-full max-w-5xl flex-1 flex-col gap-4 py-8">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}
