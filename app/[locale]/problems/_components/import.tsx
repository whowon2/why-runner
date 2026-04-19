"use client";

import { Upload, Loader } from "lucide-react";
import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { importProblems } from "@/lib/actions/problems/import-problems";

export function ImportProblems() {
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
      toast.success(`${count} problem${count !== 1 ? "s" : ""} imported`);
      queryClient.invalidateQueries({ queryKey: ["problems"] });
    } catch (err) {
      toast.error("Import failed", {
        description: err instanceof Error ? err.message : "Invalid JSON file",
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
        Import JSON
      </Button>
    </>
  );
}
