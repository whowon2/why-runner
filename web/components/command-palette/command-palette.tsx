"use client";

import {
  Check,
  Globe,
  Moon,
  Palette,
  ScrollText,
  Sun,
  SunMoon,
  Trophy,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useColorMode } from "@/hooks/use-color-mode";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { authClient } from "@/lib/auth/client";
import { PRESETS } from "@/lib/themes/presets";
import { useThemeTokens } from "@/providers/theme-tokens-provider";
import type {
  Command,
  CommandGroup as CommandGroupId,
  CommandView,
} from "./commands";
import { useCommands } from "./commands";
import { useCommandPalette } from "./palette-context";
import { usePaletteSearch } from "./use-palette-search";

type Locale = (typeof routing.locales)[number];

const GROUP_ORDER: CommandGroupId[] = [
  "navigation",
  "create",
  "preferences",
  "account",
  "legal",
];

const MODES = [
  { id: "light", icon: Sun },
  { id: "dark", icon: Moon },
  { id: "system", icon: SunMoon },
] as const;

const LOCALE_LABEL_KEYS = {
  br: "portuguese",
  en: "english",
} as const satisfies Record<Locale, string>;

// cmdk item values for the theme view; selection changes are parsed back
// into a preview.
const modeValue = (id: string) => `mode:${id}`;
const presetValue = (id: string) => `preset:${id}`;

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const t = useTranslations("CommandPalette");
  const tLanguages = useTranslations("Languages");
  const commands = useCommands();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const { theme, setTheme } = useTheme();
  const { setColorMode } = useColorMode();
  const { stored, setPreset, previewPreset } = useThemeTokens();
  const { data: session } = authClient.useSession();
  const [view, setView] = useState<"root" | CommandView>("root");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  // Mode active when the theme view opened, restored if nothing is applied.
  const originalMode = useRef<string | undefined>(undefined);
  const results = usePaletteSearch(
    search,
    open && view === "root" && !!session,
  );

  const activePresetId = stored.mode === "preset" ? stored.presetId : null;

  // next-themes persists every setTheme, so a mode preview would survive a
  // reload; put the original mode back before the page goes away.
  useEffect(() => {
    function handlePageHide() {
      if (originalMode.current !== undefined) setTheme(originalMode.current);
    }
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [setTheme]);

  function revertPreview() {
    if (originalMode.current === undefined) return;
    previewPreset(null);
    setTheme(originalMode.current);
    originalMode.current = undefined;
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      revertPreview();
      setView("root");
      setSearch("");
      setSelected("");
    }
    setOpen(next);
  }

  function close() {
    // Whatever is applied is committed: drop the snapshot before closing.
    originalMode.current = undefined;
    handleOpenChange(false);
  }

  function openView(next: CommandView) {
    setView(next);
    setSearch("");
    let initial: string = locale;
    if (next === "theme") {
      originalMode.current = theme;
      initial = activePresetId
        ? presetValue(activePresetId)
        : modeValue(theme ?? "");
    }
    setSelected(initial);
  }

  function backToRoot() {
    revertPreview();
    setView("root");
    setSearch("");
    setSelected("");
  }

  function handleSelectionChange(value: string) {
    setSelected(value);
    if (view !== "theme" || originalMode.current === undefined) return;
    const [kind, id] = value.split(":");
    if (kind === "mode") {
      previewPreset(null);
      setTheme(id);
    } else if (kind === "preset") {
      setTheme(originalMode.current);
      previewPreset(id);
    }
  }

  function runCommand(command: Command) {
    if (command.view) {
      openView(command.view);
      return;
    }
    command.action();
    close();
  }

  function navigate(href: string) {
    router.push(href);
    close();
  }

  function changeLocale(next: Locale) {
    if (next !== locale) {
      const query = searchParams.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, {
        locale: next,
      });
    }
    close();
  }

  const grouped = GROUP_ORDER.map((group) => ({
    group,
    items: commands.filter((command) => command.group === group),
  })).filter(({ items }) => items.length > 0);

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t("title")}
      description={t("searchPlaceholder")}
      // Remount per view: a fresh cmdk starts on the controlled `selected`
      // (the active theme/locale) instead of auto-selecting the first item,
      // which would otherwise fire a bogus preview.
      commandKey={view}
      commandProps={{ value: selected, onValueChange: handleSelectionChange }}
    >
      <CommandInput
        autoFocus
        placeholder={
          view === "theme"
            ? t("themePlaceholder")
            : view === "language"
              ? t("languagePlaceholder")
              : t("searchPlaceholder")
        }
        value={search}
        onValueChange={setSearch}
        onKeyDown={(event) => {
          if (view !== "root" && event.key === "Backspace" && !search) {
            event.preventDefault();
            backToRoot();
          }
        }}
      />
      <CommandList>
        <CommandEmpty>{t("empty")}</CommandEmpty>
        {view === "root" && (
          <>
            {results.problems.length > 0 && (
              <CommandGroup heading={t("groups.problems")}>
                {results.problems.map((problem) => (
                  <CommandItem
                    key={problem.id}
                    value={`problem:${problem.slug}`}
                    keywords={[results.term, problem.title, problem.code ?? ""]}
                    onSelect={() => navigate(`/problems/${problem.slug}`)}
                  >
                    <ScrollText />
                    <span className="truncate">
                      {problem.code ? `[${problem.code}] ` : ""}
                      {problem.title}
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {results.contests.length > 0 && (
              <CommandGroup heading={t("groups.contests")}>
                {results.contests.map((contest) => (
                  <CommandItem
                    key={contest.id}
                    value={`contest:${contest.slug}`}
                    keywords={[results.term, contest.name]}
                    onSelect={() => navigate(`/contests/${contest.slug}`)}
                  >
                    <Trophy />
                    <span className="truncate">{contest.name}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {grouped.map(({ group, items }, index) => (
              <Fragment key={group}>
                {index > 0 && <CommandSeparator />}
                <CommandGroup heading={t(`groups.${group}`)}>
                  {items.map((command) => (
                    <CommandItem
                      key={command.id}
                      value={command.id}
                      keywords={[command.label, ...(command.keywords ?? [])]}
                      onSelect={() => runCommand(command)}
                    >
                      <command.icon />
                      <span>{command.label}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </Fragment>
            ))}
          </>
        )}
        {view === "theme" && (
          <>
            <CommandGroup heading={t("groups.mode")}>
              {MODES.map((mode) => (
                <CommandItem
                  key={mode.id}
                  value={modeValue(mode.id)}
                  keywords={[t(`modes.${mode.id}`)]}
                  onSelect={() => {
                    setColorMode(mode.id);
                    previewPreset(null);
                    close();
                  }}
                >
                  <mode.icon />
                  <span>{t(`modes.${mode.id}`)}</span>
                  {mode.id === originalMode.current && (
                    <ActiveBadge label={t("active")} />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading={t("groups.palette")}>
              {PRESETS.map((preset) => (
                <CommandItem
                  key={preset.id}
                  value={presetValue(preset.id)}
                  keywords={[preset.name]}
                  onSelect={() => {
                    if (originalMode.current) setTheme(originalMode.current);
                    setPreset(preset.id);
                    close();
                  }}
                >
                  <Palette />
                  <span>{preset.name}</span>
                  {preset.id === activePresetId && (
                    <ActiveBadge label={t("active")} />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
        {view === "language" && (
          <CommandGroup heading={t("groups.language")}>
            {routing.locales.map((l) => (
              <CommandItem
                key={l}
                value={l}
                keywords={[tLanguages(LOCALE_LABEL_KEYS[l])]}
                onSelect={() => changeLocale(l)}
              >
                {l === locale ? <Check /> : <Globe />}
                <span>{tLanguages(LOCALE_LABEL_KEYS[l])}</span>
                {l === locale && <ActiveBadge label={t("active")} />}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

function ActiveBadge({ label }: { label: string }) {
  return <span className="text-muted-foreground ml-auto text-xs">{label}</span>;
}
