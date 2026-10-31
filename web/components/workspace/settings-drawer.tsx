"use client";

import { Minus, Moon, Plus, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useColorMode } from "@/hooks/use-color-mode";
import { PresetGrid } from "@/app/[locale]/settings/_components/preset-grid";
import { EditorSettingsControls } from "@/components/editor-settings-controls";
import { Button } from "@/components/ui/button";
import {
  EDITOR_FONT_SIZE_MAX,
  EDITOR_FONT_SIZE_MIN,
  useEditorFontSize,
} from "@/hooks/use-editor-settings";

/** Editor settings (shared with every editor), light/dark and the color preset. */
export function SettingsDrawer() {
  const t = useTranslations("Workspace.Settings");
  const { fontSize, setFontSize } = useEditorFontSize();
  const { resolvedTheme, setColorMode } = useColorMode();
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
      <EditorSettingsControls />
      <div className="flex items-center justify-between gap-4">
        <span className="text-sm">{t("theme")}</span>
        <Button
          onClick={() => setColorMode(dark ? "light" : "dark")}
          variant="outline"
        >
          {dark ? <Moon /> : <Sun />}
          {dark ? t("dark") : t("light")}
        </Button>
      </div>
      <div className="flex flex-col gap-3">
        <span className="text-sm">{t("preset")}</span>
        <PresetGrid className="grid-cols-2 sm:grid-cols-2 md:grid-cols-2" />
      </div>
    </div>
  );
}
