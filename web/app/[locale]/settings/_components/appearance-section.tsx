"use client";

import { Moon, Sun } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useThemeTokens } from "@/providers/theme-tokens-provider";
import { CustomThemeForm } from "./custom-theme-form";
import { PresetGrid } from "./preset-grid";

type AppearanceMode = "preset" | "custom";

export function AppearanceSection() {
  const t = useTranslations("SettingsPage.appearance");
  const { stored } = useThemeTokens();
  const [mode, setMode] = useState<AppearanceMode>(stored.mode);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h3 className="text-sm font-medium">{t("mode")}</h3>

        <div className="flex border shrink-0">
          <button
            type="button"
            disabled={!mounted}
            onClick={() => setTheme("light")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium cursor-pointer disabled:cursor-default ${
              mounted && theme === "light"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground"
            }`}
          >
            <Sun size={16} />
            {t("light")}
          </button>
          <button
            type="button"
            disabled={!mounted}
            onClick={() => setTheme("dark")}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium cursor-pointer border-l disabled:cursor-default ${
              mounted && theme === "dark"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground"
            }`}
          >
            <Moon size={16} />
            {t("dark")}
          </button>
        </div>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            {t("description")}
          </p>
        </div>

        <div className="flex border shrink-0">
          <button
            type="button"
            onClick={() => setMode("preset")}
            className={`px-4 py-2 text-sm font-medium cursor-pointer ${
              mode === "preset"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground"
            }`}
          >
            {t("preset")}
          </button>
          <button
            type="button"
            onClick={() => setMode("custom")}
            className={`px-4 py-2 text-sm font-medium cursor-pointer border-l ${
              mode === "custom"
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground"
            }`}
          >
            {t("custom")}
          </button>
        </div>
      </div>

      {mode === "preset" ? <PresetGrid /> : <CustomThemeForm />}
    </section>
  );
}
