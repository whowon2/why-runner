"use client";

import { GraduationCap, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ClassroomRole } from "@/drizzle/schema";
import { useSetMemberRole } from "@/hooks/use-set-member-role";

/** Owner-level only: toggle a member between student and co-teacher. */
export function MemberRoleButton({
  classroomId,
  userId,
  role,
}: {
  classroomId: string;
  userId: string;
  role: ClassroomRole;
}) {
  const t = useTranslations("ClassesPage");
  const { mutate: setRole, isPending } = useSetMemberRole();
  const label = role === "teacher" ? t("makeStudent") : t("makeCoTeacher");

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          disabled={isPending}
          size="icon"
          variant="ghost"
          onClick={() =>
            setRole(
              {
                classroomId,
                userId,
                role: role === "teacher" ? "student" : "teacher",
              },
              {
                onError: (error: Error) => toast.error(error.message),
                onSuccess: () => toast.success(t("roleChanged")),
              },
            )
          }
        >
          {role === "teacher" ? (
            <UserRound className="size-4" />
          ) : (
            <GraduationCap className="size-4" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
