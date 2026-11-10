"use client";

import {
  GraduationCap,
  MoreHorizontal,
  UserMinus,
  UserRound,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRemoveMember } from "@/hooks/use-remove-member";
import { useSetMemberRole } from "@/hooks/use-set-member-role";

/**
 * Every action on one roster row, behind a single "⋯" trigger. Owner-level
 * users can switch student ↔ co-teacher and remove either; co-teachers can
 * only remove students. Renders nothing when the viewer has no action.
 */
export function MemberActionsMenu({
  classroomId,
  userId,
  name,
  role,
  isOwner,
}: {
  classroomId: string;
  userId: string;
  name: string;
  role: "student" | "teacher";
  /** Viewer is owner-level (owner or admin). */
  isOwner: boolean;
}) {
  const t = useTranslations("ClassesPage");
  const tCommon = useTranslations("Common");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { mutate: setRole, isPending: isRolePending } = useSetMemberRole();
  const { mutate: removeMember, isPending: isRemovePending } =
    useRemoveMember();

  const isCoTeacher = role === "teacher";
  const canChangeRole = isOwner;
  const canRemove = isOwner || !isCoTeacher;
  if (!canChangeRole && !canRemove) return null;

  function handleRoleChange() {
    setRole(
      { classroomId, userId, role: isCoTeacher ? "student" : "teacher" },
      {
        onError: (error: Error) => toast.error(error.message),
        onSuccess: () => toast.success(t("roleChanged")),
      },
    );
  }

  function handleRemove() {
    removeMember(
      { classroomId, userId },
      {
        onError: (error: Error) => toast.error(error.message),
        onSuccess: () =>
          toast.success(
            t(isCoTeacher ? "removeCoTeacherSuccess" : "removeStudentSuccess"),
          ),
      },
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            aria-label={t("memberActionsFor", { name })}
            className="shrink-0"
            disabled={isRolePending || isRemovePending}
            size="icon"
            variant="ghost"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canChangeRole && (
            <DropdownMenuItem onSelect={handleRoleChange}>
              {isCoTeacher ? <UserRound /> : <GraduationCap />}
              {t(isCoTeacher ? "makeStudent" : "makeCoTeacher")}
            </DropdownMenuItem>
          )}
          {canChangeRole && canRemove && <DropdownMenuSeparator />}
          {canRemove && (
            <DropdownMenuItem
              onSelect={() => setConfirmOpen(true)}
              variant="destructive"
            >
              <UserMinus />
              {t(isCoTeacher ? "removeCoTeacher" : "removeStudent")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Outside the menu: a dialog nested in a menu item would close with it. */}
      <AlertDialog onOpenChange={setConfirmOpen} open={confirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(isCoTeacher ? "removeCoTeacherTitle" : "removeStudentTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                isCoTeacher
                  ? "removeCoTeacherDescription"
                  : "removeStudentDescription",
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemove}>
              {tCommon("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
