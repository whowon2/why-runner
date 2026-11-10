import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { BackButton } from "@/components/back-button";

interface PageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  action?: ReactNode;
  /** Explicit parent route; renders a back icon button before the badge. */
  backHref?: string;
}

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  action,
  backHref,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        {backHref && <BackButton href={backHref} />}
        <span className="shrink-0 p-2 border bg-primary/10">
          <Icon className="w-6 h-6 text-primary" />
        </span>
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-bold tracking-tight break-words">
            {title}
          </h1>
          <p className="text-muted-foreground text-sm">{subtitle}</p>
        </div>
      </div>
      {action && <div className="shrink-0 flex gap-2">{action}</div>}
    </div>
  );
}
