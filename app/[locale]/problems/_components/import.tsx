"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader, Upload } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { importProblems } from "@/lib/actions/problems/import-problems";

export function ImportProblems() {
  const t = useTranslations("ImportProblems");
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsPending(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const count = await importProblems(data);
      toast.success(t("success", { count }));
      queryClient.invalidateQueries({ queryKey: ["problems"] });
    } catch (err) {
      toast.error(t("failed"), {
        description: err instanceof Error ? err.message : t("invalidJson"),
      });
    } finally {
      setIsPending(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFile}
      />
      <Button
        variant="outline"
        disabled={isPending}
        onClick={() => fileRef.current?.click()}
      >
        {isPending ? <Loader className="animate-spin" /> : <Upload />}
        {t("button")}
      </Button>
    </>
  );
}
