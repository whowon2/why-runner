"use client";

import {
  BookOpen,
  Copy,
  Ellipsis,
  LogOut,
  Pencil,
  School,
  Sheet,
  Trash2,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const [openDialog, setOpenDialog] = useState<
    "edit" | "leave" | "delete" | null
  >(null);

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
      <div className="flex flex-col gap-4">
        <PageHeader
          backHref="/classes"
          icon={School}
          subtitle={t("memberCount", { count: memberCount })}
          title={classroom.name}
        />
        {canManage ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-y py-2">
            <Button
              aria-label={`${t("joinCode")}: ${classroom.joinCode}`}
              className="font-mono"
              onClick={() => {
                navigator.clipboard.writeText(classroom.joinCode);
                toast.success(t("codeCopied"));
              }}
              size="sm"
              title={t("joinCode")}
              variant="outline"
            >
              <span className="text-muted-foreground">{t("joinCode")}</span>
              <span className="font-semibold tracking-wider">
                {classroom.joinCode}
              </span>
              <Copy className="size-3.5 text-muted-foreground" />
            </Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild variant="outline">
                <Link href={`/classes/${classroom.slug}/gradebook`}>
                  <Sheet className="size-4" />
                  {t("gradebook")}
                </Link>
              </Button>
              <CreateLessonButton
                classSlug={classroom.slug}
                classroomId={classroomId}
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    aria-label={t("moreActions")}
                    size="icon"
                    title={t("moreActions")}
                    variant="outline"
                  >
                    <Ellipsis className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  // Keep focus from snapping back to the trigger, which
                  // would count as "focus outside" and close the dialog
                  // the selected item just opened.
                  onCloseAutoFocus={(e) => e.preventDefault()}
                >
                  <DropdownMenuItem onSelect={() => setOpenDialog("edit")}>
                    <Pencil />
                    {t("editClass")}
                  </DropdownMenuItem>
                  {role === "teacher" && (
                    <DropdownMenuItem onSelect={() => setOpenDialog("leave")}>
                      <LogOut />
                      {t("leaveClass")}
                    </DropdownMenuItem>
                  )}
                  {isOwner && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onSelect={() => setOpenDialog("delete")}
                        variant="destructive"
                      >
                        <Trash2 />
                        {t("deleteClass")}
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <EditClassDialog
              classroomId={classroomId}
              name={classroom.name}
              onOpenChange={(open) => setOpenDialog(open ? "edit" : null)}
              open={openDialog === "edit"}
            />
            {role === "teacher" && (
              <LeaveClassButton
                classroomId={classroomId}
                onOpenChange={(open) => setOpenDialog(open ? "leave" : null)}
                open={openDialog === "leave"}
              />
            )}
            {isOwner && (
              <DeleteClassDialog
                classroomId={classroomId}
                onOpenChange={(open) => setOpenDialog(open ? "delete" : null)}
                open={openDialog === "delete"}
              />
            )}
          </div>
        ) : (
          <div className="flex justify-end">
            <LeaveClassButton classroomId={classroomId} />
          </div>
        )}
      </div>

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
