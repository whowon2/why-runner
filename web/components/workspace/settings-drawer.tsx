"use client";

import { Minus, Moon, Plus, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  EDITOR_FONT_SIZE_MAX,
  EDITOR_FONT_SIZE_MIN,
  useEditorFontSize,
} from "@/hooks/use-editor-font-size";

/** Editor font size (shared with every editor) and the site theme. */
export function SettingsDrawer() {
  const t = useTranslations("Workspace.Settings");
  const { fontSize, setFontSize } = useEditorFontSize();
  const { resolvedTheme, setTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm">{t("fontSize")}</span>
        <div className="flex items-center gap-2">
          <Button
            aria-label={t("smaller")}
            disabled={fontSize <= EDITOR_FONT_SIZE_MIN}
            onClick={() => setFontSize(fontSize - 1)}
            size="icon"
            variant="outline"
          >
            <Minus />
          </Button>
          <span className="w-8 text-center tabular-nums">{fontSize}</span>
          <Button
            aria-label={t("larger")}
            disabled={fontSize >= EDITOR_FONT_SIZE_MAX}
            onClick={() => setFontSize(fontSize + 1)}
            size="icon"
            variant="outline"
          >
            <Plus />
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm">{t("theme")}</span>
        <Button
          onClick={() => setTheme(dark ? "light" : "dark")}
          variant="outline"
        >
          {dark ? <Moon /> : <Sun />}
          {dark ? t("dark") : t("light")}
        </Button>
      </div>
    </div>
  );
}
