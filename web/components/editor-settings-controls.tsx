"use client";

import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { Switch } from "@/components/ui/switch";
import {
  useEditorAutoClose,
  useEditorLineNumbers,
  useEditorMinimap,
  useEditorTabSize,
  useEditorVim,
  useEditorWordWrap,
} from "@/hooks/use-editor-settings";
import { LINE_NUMBERS, TAB_SIZES } from "@/lib/preferences";
import { cn } from "@/lib/utils";

/**
 * The editor options other than font size (each surface lays that one out
 * itself), shared by `/settings` and the workspace Settings drawer.
 */
export function EditorSettingsControls({
  rowClassName,
}: {
  rowClassName?: string;
}) {
  const t = useTranslations("SettingsPage.editor");
  const [autoClose, setAutoClose] = useEditorAutoClose();
  const [vim, setVim] = useEditorVim();
  const [tabSize, setTabSize] = useEditorTabSize();
  const [wordWrap, setWordWrap] = useEditorWordWrap();
  const [lineNumbers, setLineNumbers] = useEditorLineNumbers();
  const [minimap, setMinimap] = useEditorMinimap();

  return (
    <>
      <SettingRow className={rowClassName} label={t("tabSize")}>
        <Segmented
          label={t("tabSize")}
          onChange={setTabSize}
          options={TAB_SIZES.map((size) => ({ value: size, label: size }))}
          value={tabSize}
        />
      </SettingRow>
      <SettingRow className={rowClassName} label={t("lineNumbers")}>
        <Segmented
          label={t("lineNumbers")}
          onChange={setLineNumbers}
          options={LINE_NUMBERS.map((mode) => ({
            value: mode,
            label: t(`lineNumberModes.${mode}`),
          }))}
          value={lineNumbers}
        />
      </SettingRow>
      <SettingRow className={rowClassName} label={t("autoClose")}>
        <Switch
          aria-label={t("autoClose")}
          checked={autoClose}
          onCheckedChange={setAutoClose}
        />
      </SettingRow>
      <SettingRow className={rowClassName} label={t("wordWrap")}>
        <Switch
          aria-label={t("wordWrap")}
          checked={wordWrap}
          onCheckedChange={setWordWrap}
        />
      </SettingRow>
      <SettingRow className={rowClassName} label={t("minimap")}>
        <Switch
          aria-label={t("minimap")}
          checked={minimap}
          onCheckedChange={setMinimap}
        />
      </SettingRow>
      <SettingRow
        className={rowClassName}
        description={t("vimDescription")}
        label={t("vim")}
      >
        <Switch aria-label={t("vim")} checked={vim} onCheckedChange={setVim} />
      </SettingRow>
    </>
  );
}

export function SettingRow({
  label,
  description,
  className,
  children,
}: {
  label: string;
  description?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm">{label}</span>
        {description && (
          <span className="text-xs text-muted-foreground max-w-md">
            {description}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Segmented<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div aria-label={label} className="flex border shrink-0" role="group">
      {options.map((option, index) => (
        <button
          aria-pressed={option.value === value}
          className={cn(
            "px-3 py-1.5 text-sm font-medium cursor-pointer",
            index > 0 && "border-l",
            option.value === value
              ? "bg-primary text-primary-foreground"
              : "bg-background text-foreground",
          )}
          key={option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
