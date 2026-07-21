"use client";

import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("ErrorPage");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center p-8">
      <h2 className="text-2xl font-bold">{t("title")}</h2>
      <p className="text-muted-foreground max-w-md">
        {error.message?.includes("connect")
          ? t("connectError")
          : t("genericError")}
      </p>
      <Button onClick={reset} variant="outline">
        {t("tryAgain")}
      </Button>
    </div>
  );
}
