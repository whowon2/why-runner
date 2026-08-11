"use client";

import { GraduationCap, School, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useMyClasses } from "@/hooks/use-my-classes";
import { CreateClassButton } from "./create-class-button";
import { JoinClassForm } from "./join-class-form";

export function ClassList() {
  const t = useTranslations("ClassesPage");
  const { data, isPending } = useMyClasses();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <PageHeader icon={School} title={t("title")} subtitle={t("subtitle")} />
        <div className="flex items-center gap-2">
          <JoinClassForm />
          <CreateClassButton />
        </div>
      </div>

      {isPending ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <>
          {data && data.owned.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-medium text-muted-foreground text-sm">
                {t("myClasses")}
              </h2>
              <ClassGrid classes={data.owned} role="professor" />
            </div>
          )}
          {data && data.joined.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-medium text-muted-foreground text-sm">
                {t("joinedClasses")}
              </h2>
              <ClassGrid classes={data.joined} role="student" />
            </div>
          )}
          {data && data.owned.length === 0 && data.joined.length === 0 && (
            <p className="text-muted-foreground">{t("empty")}</p>
          )}
        </>
      )}
    </div>
  );
}

function ClassGrid({
  classes,
  role,
}: {
  classes: { id: string; slug: string; name: string; memberCount: number }[];
  role: "professor" | "student";
}) {
  const t = useTranslations("ClassesPage");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {classes.map((c) => (
        <Link href={`/classes/${c.slug}`} key={c.id}>
          <Card className="h-full bg-muted/30 transition-colors hover:bg-muted/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="size-4" />
                {c.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap items-center gap-2">
              <Badge variant={role === "professor" ? "default" : "outline"}>
                {role === "professor" ? t("roleProfessor") : t("roleStudent")}
              </Badge>
              <span className="flex items-center gap-1 text-muted-foreground text-xs">
                <Users className="size-3.5" />
                {t("memberCount", { count: c.memberCount })}
              </span>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
