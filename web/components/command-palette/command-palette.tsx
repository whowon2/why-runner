"use client";

import { Palette } from "lucide-react";
import { useTranslations } from "next-intl";
import { Fragment, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { PRESETS } from "@/lib/themes/presets";
import { useThemeTokens } from "@/providers/theme-tokens-provider";
import type { Command, CommandGroup as CommandGroupId } from "./commands";
import { useCommands } from "./commands";
import { useCommandPalette } from "./palette-context";

const GROUP_ORDER: CommandGroupId[] = ["navigation", "create", "account"];

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const t = useTranslations("CommandPalette");
  const commands = useCommands();
  const { stored, setPreset } = useThemeTokens();
  const [view, setView] = useState<"root" | "theme">("root");
  const [search, setSearch] = useState("");

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setView("root");
      setSearch("");
    }
  }

  function openThemeView() {
    setView("theme");
    setSearch("");
  }

  function runCommand(command: Command) {
    command.action();
    handleOpenChange(false);
  }

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: commands.filter((command) => command.group === group),
  })).filter(({ items }) => items.length > 0);

  const activePresetId = stored.mode === "preset" ? stored.presetId : null;

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t("title")}
      description={t("searchPlaceholder")}
    >
      <CommandInput
        placeholder={t("searchPlaceholder")}
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>{t("empty")}</CommandEmpty>
        {view === "root" ? (
          <>
            {grouped.map(({ group, items }, index) => (
              <Fragment key={group}>
                <CommandGroup heading={t(`groups.${group}`)}>
                  {items.map((command) => (
                    <CommandItem
                      key={command.id}
                      value={command.label}
                      onSelect={() => runCommand(command)}
                    >
                      <command.icon />
                      <span>{command.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
                {index < grouped.length - 1 && <CommandSeparator />}
              </Fragment>
            ))}
            <CommandSeparator />
            <CommandGroup heading={t("groups.theme")}>
              <CommandItem
                value={t("commands.changeTheme")}
                onSelect={openThemeView}
              >
                <Palette />
                <span>{t("commands.changeTheme")}</span>
              </CommandItem>
            </CommandGroup>
          </>
        ) : (
          <CommandGroup heading={t("groups.theme")}>
            {PRESETS.map((preset) => (
              <CommandItem
                key={preset.id}
                value={preset.name}
                onSelect={() => {
                  setPreset(preset.id);
                  handleOpenChange(false);
                }}
              >
                <Palette />
                <span>{preset.name}</span>
                {preset.id === activePresetId && (
                  <span className="text-muted-foreground ml-auto text-xs">
                    {t("themeActive")}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
