"use client";

import { UserMinus } from "lucide-react";
import { useTranslations } from "next-intl";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useRemoveMember } from "@/hooks/use-remove-member";

export function RemoveMemberButton({
  classroomId,
  userId,
  coTeacher = false,
}: {
  classroomId: string;
  userId: string;
  coTeacher?: boolean;
}) {
  const t = useTranslations("ClassesPage");
  const tCommon = useTranslations("Common");
  const { mutate: removeMember, isPending } = useRemoveMember();

  function handleRemove() {
    removeMember(
      { classroomId, userId },
      {
        onError: (error: Error) => toast.error(error.message),
        onSuccess: () =>
          toast.success(
            t(coTeacher ? "removeCoTeacherSuccess" : "removeStudentSuccess"),
          ),
      },
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          aria-label={t(coTeacher ? "removeCoTeacher" : "removeStudent")}
          disabled={isPending}
          size="icon"
          variant="ghost"
        >
          <UserMinus className="size-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t(coTeacher ? "removeCoTeacherTitle" : "removeStudentTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t(
              coTeacher
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
  );
}
