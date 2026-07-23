"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { LEGAL_SLUGS, type LegalSlugKey } from "@/lib/legal-routes";

export function LegalFooterLinks() {
  const t = useTranslations("Footer.links");

  return (
    <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
      {(Object.entries(LEGAL_SLUGS) as [LegalSlugKey, string][]).map(([key, href]) => (
        <Link key={key} href={href} className="hover:text-foreground transition-colors">
          {t(key)}
        </Link>
      ))}
    </nav>
  );
}
