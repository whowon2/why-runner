"use client";

import { Minus, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  EditorSettingsControls,
  SettingRow,
} from "@/components/editor-settings-controls";
import { Button } from "@/components/ui/button";
import {
  EDITOR_FONT_SIZE_MAX,
  EDITOR_FONT_SIZE_MIN,
  useEditorFontSize,
} from "@/hooks/use-editor-settings";

const ROW = "px-4 py-3 border-b last:border-b-0";

export function EditorSection() {
  const t = useTranslations("SettingsPage.editor");
  const { fontSize, setFontSize } = useEditorFontSize();

  return (
    <section className="flex flex-col gap-6">
      <div>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground max-w-md">
          {t("description")}
        </p>
      </div>

      <div className="flex flex-col border">
        <SettingRow className={ROW} label={t("fontSize")}>
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
        </SettingRow>
        <EditorSettingsControls rowClassName={ROW} />
      </div>
    </section>
  );
}
