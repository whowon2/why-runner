import {
  ClipboardList,
  type LucideIcon,
  School,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";

const LINKS = [
  { key: "contests", href: "/admin/contests", icon: Trophy },
  { key: "classes", href: "/admin/classes", icon: School },
  { key: "surveys", href: "/surveys/results", icon: ClipboardList },
  { key: "users", href: "/admin/users", icon: Users },
] as const satisfies { key: string; href: string; icon: LucideIcon }[];

export async function AdminHub() {
  const t = await getTranslations("AdminPage");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 py-8">
      <PageHeader
        icon={ShieldCheck}
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {LINKS.map(({ key, href, icon: Icon }) => (
          <Link href={href} key={key}>
            <Card className="h-full bg-muted/30 transition-colors hover:bg-muted/60">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className="size-4" />
                  {t(`links.${key}`)}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                {t(`links.${key}Hint`)}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
