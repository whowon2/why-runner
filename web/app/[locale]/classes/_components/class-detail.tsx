"use client";

import { BookOpen, Copy, School, Sheet, Users } from "lucide-react";
import { useTranslations } from "next-intl";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/navigation";
import { useClass } from "@/hooks/use-class";
import { ClassLessons } from "./class-lessons";
import { ClassPeople } from "./class-people";
import { CreateLessonButton } from "./create-lesson-button";
import { DeleteClassDialog } from "./delete-class-dialog";
import { EditClassDialog } from "./edit-class-dialog";
import { LeaveClassButton } from "./leave-class-button";

const CLASS_TABS = ["lessons", "people"] as const;
type ClassTab = (typeof CLASS_TABS)[number];

export function ClassDetail({ classroomId }: { classroomId: string }) {
  const t = useTranslations("ClassesPage");
  const { data: classData, isPending: isClassPending } = useClass(classroomId);
  // Managers' tab lives in the URL (`?tab=people`) so reloads and shared
  // links keep it; students have no tabs.
  const [tab, setTab] = useQueryState(
    "tab",
    parseAsStringLiteral(CLASS_TABS).withDefault("lessons"),
  );

  if (isClassPending) return <Skeleton className="h-32 w-full" />;
  if (!classData) return null;

  // canManage: owner, co-teachers and admins. isOwner: owner-level (owner or
  // admin) — only they delete the class and manage co-teachers.
  const { classroom, role, canManage, isOwner, memberCount, members } =
    classData;

  const lessons = (
    <ClassLessons
      canManage={canManage}
      classSlug={classroom.slug}
      classroomId={classroomId}
    />
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        action={
          canManage ? (
            <>
              <Button
                onClick={() => {
                  navigator.clipboard.writeText(classroom.joinCode);
                  toast.success(t("codeCopied"));
                }}
                variant="outline"
              >
                <Copy className="size-4" />
                {t("joinCode")}: {classroom.joinCode}
              </Button>
              <Button asChild variant="outline">
                <Link href={`/classes/${classroom.slug}/gradebook`}>
                  <Sheet className="size-4" />
                  {t("gradebook")}
                </Link>
              </Button>
              <EditClassDialog
                classroomId={classroomId}
                name={classroom.name}
              />
              <CreateLessonButton
                classSlug={classroom.slug}
                classroomId={classroomId}
              />
              {isOwner && <DeleteClassDialog classroomId={classroomId} />}
              {role === "teacher" && (
                <LeaveClassButton classroomId={classroomId} />
              )}
            </>
          ) : (
            <LeaveClassButton classroomId={classroomId} />
          )
        }
        icon={School}
        subtitle={t("memberCount", { count: memberCount })}
        title={classroom.name}
      />

      {canManage ? (
        <Tabs onValueChange={(value) => setTab(value as ClassTab)} value={tab}>
          <TabsList>
            <TabsTrigger value="lessons">
              <BookOpen className="size-4" />
              {t("tabLessons")}
            </TabsTrigger>
            <TabsTrigger value="people">
              <Users className="size-4" />
              {t("tabPeople")}
              <Badge className="tabular-nums" variant="secondary">
                {memberCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
          <TabsContent className="mt-4" value="lessons">
            {lessons}
          </TabsContent>
          <TabsContent className="mt-4" value="people">
            <ClassPeople
              classSlug={classroom.slug}
              classroomId={classroomId}
              coTeachers={classData.coTeachers}
              isOwner={isOwner}
              owner={classData.owner}
              students={members}
            />
          </TabsContent>
        </Tabs>
      ) : (
        lessons
      )}
    </div>
  );
}
