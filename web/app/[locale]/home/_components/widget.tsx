import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

/** Shared frame for every `/home` widget: icon + title header, body below. */
export function Widget({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="h-full gap-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="size-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">{children}</CardContent>
    </Card>
  );
}

export function WidgetEmpty({
  message,
  href,
  cta,
}: {
  message: string;
  href: string;
  cta: string;
}) {
  return (
    <div className="flex flex-col items-start gap-2 border border-dashed p-4 text-sm">
      <p className="text-muted-foreground">{message}</p>
      <Link href={href} className="font-medium text-primary hover:underline">
        {cta}
      </Link>
    </div>
  );
}

/** One clickable row inside a widget. */
export function WidgetRow({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 border p-3 transition-colors hover:bg-muted/60"
    >
      {children}
    </Link>
  );
}
