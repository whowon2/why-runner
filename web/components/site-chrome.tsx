"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";
import { isWorkspacePath } from "@/lib/workspace-routes";

/** Renders site-wide chrome (dock, footer) except on editor workspace pages. */
export function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (isWorkspacePath(pathname)) return null;
  return children;
}
