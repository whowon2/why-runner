"use client";

import { Bell, Palette } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export type SettingsSection = "appearance" | "notifications";

export function SettingsNav({
  active,
  onChange,
}: {
  active: SettingsSection;
  onChange: (section: SettingsSection) => void;
}) {
  const t = useTranslations("SettingsPage.nav");
  const sections: { id: SettingsSection; label: string; icon: typeof Palette }[] = [
    { id: "appearance", label: t("appearance"), icon: Palette },
    { id: "notifications", label: t("notifications"), icon: Bell },
  ];

  return (
    <nav className="flex md:flex-col gap-1 md:w-48 shrink-0">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => onChange(section.id)}
          className={cn(
            "flex items-center gap-2 px-3 py-2 border text-sm font-medium text-left cursor-pointer",
            active === section.id
              ? "bg-secondary text-secondary-foreground"
              : "bg-background text-foreground hover:bg-secondary/50",
          )}
        >
          <section.icon size={16} />
          {section.label}
        </button>
      ))}
    </nav>
  );
}
