"use client";

import { Check, Globe } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Locale = (typeof routing.locales)[number];

const LABEL_KEYS = {
  br: "portuguese",
  en: "english",
} as const satisfies Record<Locale, string>;

export function LanguageSwitcher() {
  const t = useTranslations("Languages");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const locale = useLocale();

  function handleLocaleChange(next: Locale) {
    if (next === locale) return;
    const query = searchParams.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      locale: next,
    });
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label={t("placeholder")}
              className="inline-flex size-9 items-center justify-center rounded-none hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer"
            >
              <Globe className="size-4" />
            </button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>
          <p>{t("placeholder")}</p>
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="center" sideOffset={8}>
        {routing.locales.map((l) => (
          <DropdownMenuItem key={l} onClick={() => handleLocaleChange(l)}>
            {locale === l ? <Check /> : <span className="size-4" />}
            {t(LABEL_KEYS[l])}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
