"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { matchesMemberQuery } from "@/lib/member-search";
import { AddCoTeacherDialog } from "./add-co-teacher-dialog";
import { MemberActionsMenu } from "./member-actions-menu";
import { MemberRow, type RosterMember } from "./member-row";
import { type SheetStudent, StudentSheet } from "./student-sheet";

/** Manager-only "People" tab: teachers, searchable students, student panel. */
export function ClassPeople({
  classroomId,
  classSlug,
  isOwner,
  owner,
  coTeachers,
  students,
}: {
  classroomId: string;
  classSlug: string;
  /** Viewer is owner-level (owner or admin). */
  isOwner: boolean;
  owner: RosterMember | null;
  coTeachers: RosterMember[];
  students: SheetStudent[];
}) {
  const t = useTranslations("ClassesPage");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // A promoted or removed student drops out of `students`, closing the panel.
  const selected = students.find((s) => s.id === selectedId) ?? null;
  const filtered = students.filter((s) => matchesMemberQuery(s, query));
  const teacherCount = coTeachers.length + (owner ? 1 : 0);

  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-transparent shadow-none">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">
            {t("teachersWithCount", { count: teacherCount })}
          </CardTitle>
          {isOwner && <AddCoTeacherDialog classroomId={classroomId} />}
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col divide-y border">
            {owner && (
              <MemberRow
                badge={<Badge variant="default">{t("roleOwner")}</Badge>}
                member={owner}
              />
            )}
            {coTeachers.map((m) => (
              <MemberRow
                actions={
                  <MemberActionsMenu
                    classroomId={classroomId}
                    isOwner={isOwner}
                    name={m.name}
                    role="teacher"
                    userId={m.id}
                  />
                }
                badge={<Badge variant="outline">{t("roleCoTeacher")}</Badge>}
                key={m.id}
                member={m}
              />
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-transparent shadow-none">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">
            {t("studentsWithCount", { count: students.length })}
          </CardTitle>
          {students.length > 0 && (
            <InputGroup className="sm:max-w-xs">
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                aria-label={t("searchStudents")}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("searchStudentsPlaceholder")}
                type="search"
                value={query}
              />
            </InputGroup>
          )}
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("noStudentsYet")}
            </p>
          ) : filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              {t("noStudentsMatch")}
            </p>
          ) : (
            <ul className="flex flex-col divide-y border">
              {filtered.map((m) => (
                <MemberRow
                  actions={
                    <MemberActionsMenu
                      classroomId={classroomId}
                      isOwner={isOwner}
                      name={m.name}
                      role="student"
                      userId={m.id}
                    />
                  }
                  key={m.id}
                  member={m}
                  onOpen={() => setSelectedId(m.id)}
                />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <StudentSheet
        classSlug={classSlug}
        classroomId={classroomId}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
        student={selected}
      />
    </div>
  );
}
