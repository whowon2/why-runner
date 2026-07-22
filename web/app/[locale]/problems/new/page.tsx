"use client";

import { Loader } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useCreateProblem } from "@/hooks/use-create-problem";
import { useRouter } from "@/i18n/navigation";
import { authClient } from "@/lib/auth/client";

export default function NewProblemPage() {
  const t = useTranslations("ProblemsPage");
  const { mutate: createProblem } = useCreateProblem();
  const router = useRouter();
  const hasFired = useRef(false);
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();

  useEffect(() => {
    if (isSessionPending) return;
    if (!session) {
      router.replace("/auth/signin");
      return;
    }
    if (hasFired.current) return;
    hasFired.current = true;
    createProblem(undefined, {
      onError: (error) => {
        toast.error(t("failedCreateDraft"), { description: error.message });
        router.push("/problems");
      },
      onSuccess: (data) => {
        router.replace(`/problems/${data.slug}?tab=edit`);
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSessionPending, session]);

  return (
    <div className="flex w-full flex-1 items-center justify-center gap-2 p-8 text-muted-foreground">
      <Loader className="animate-spin h-4 w-4" />
      {t("creatingDraft")}
    </div>
  );
}
