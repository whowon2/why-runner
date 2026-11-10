"use client";

import { Languages } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Language } from "@/drizzle/schema";

/**
 * Teacher-side editor of an allowed-languages list (lesson exercise or
 * contest problem). No box checked = any language.
 */
export function AllowedLanguagesDialog({
  value,
  description,
  disabled,
  saving,
  onSave,
}: {
  value: Language[];
  description: string;
  disabled?: boolean;
  saving: boolean;
  /** Call `done` after a successful save to close the dialog. */
  onSave: (languages: Language[], done: () => void) => void;
}) {
  const t = useTranslations("AllowedLanguages");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Language[]>(value);

  function toggle(lang: Language, checked: boolean) {
    setSelected((prev) =>
      checked ? [...prev, lang] : prev.filter((l) => l !== lang),
    );
  }

  return (
    <Dialog
      onOpenChange={(next) => {
        if (next) setSelected(value);
        setOpen(next);
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button disabled={disabled} size="sm" type="button" variant="outline">
          <Languages className="size-3.5" />
          {t("trigger")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3" translate="no">
          {Language.enumValues.map((lang) => (
            <div className="flex items-center gap-2" key={lang}>
              <Checkbox
                checked={selected.includes(lang)}
                id={`allowed-${lang}`}
                onCheckedChange={(checked) => toggle(lang, checked === true)}
              />
              <Label className="font-mono" htmlFor={`allowed-${lang}`}>
                {lang}
              </Label>
            </div>
          ))}
        </div>
        {selected.length === 0 && (
          <p className="text-muted-foreground text-sm">{t("any")}</p>
        )}
        <DialogFooter>
          <Button
            disabled={saving}
            onClick={() => onSave(selected, () => setOpen(false))}
            type="button"
          >
            {t("save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Read-only badges for a non-empty list (nothing when any language). */
export function AllowedLanguagesBadges({
  languages,
}: {
  languages: Language[];
}) {
  if (languages.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-1" translate="no">
      {languages.map((lang) => (
        <span
          className="border px-1.5 py-0.5 font-mono text-muted-foreground text-xs"
          key={lang}
        >
          {lang}
        </span>
      ))}
    </span>
  );
}
