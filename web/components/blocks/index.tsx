"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Blockly touches `window` on import and is large: load it client-side only,
// and only on pages that actually render blocks.
export const BlockWorkspace = dynamic(() => import("./block-workspace"), {
  ssr: false,
  loading: () => <Skeleton className="h-[480px] w-full" />,
});
