"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "@/i18n/navigation";

export function BreadCrumbs() {
  const t = useTranslations("BreadCrumbs");
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean); // Remove empty strings

  return (
    <Breadcrumb className="p-2">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">{t("home")}</BreadcrumbLink>
        </BreadcrumbItem>

        {segments.map((segment, idx) => {
          const href = `/${segments.slice(0, idx + 1).join("/")}`;
          const isLast = idx === segments.length - 1;

          return (
            <React.Fragment key={href}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{decodeURIComponent(segment)}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={href}>
                    {decodeURIComponent(segment)}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
