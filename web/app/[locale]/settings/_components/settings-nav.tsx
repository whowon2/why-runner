"use client";

import { Palette } from "lucide-react";
import { useTranslations } from "next-intl";

export function SettingsNav() {
  const t = useTranslations("SettingsPage.nav");
  const sections = [{ id: "appearance", label: t("appearance"), icon: Palette }];

  return (
    <nav className="flex md:flex-col gap-1 md:w-48 shrink-0">
      {sections.map((section) => (
        <div
          key={section.id}
          className="flex items-center gap-2 px-3 py-2 border text-sm font-medium bg-secondary text-secondary-foreground"
        >
          <section.icon size={16} />
          {section.label}
        </div>
      ))}
    </nav>
  );
}
