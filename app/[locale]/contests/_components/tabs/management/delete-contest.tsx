"use client";

import { Loader, Trash2 } from "lucide-react";
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
import { useDeleteContest } from "@/hooks/use-delete-contest";
import { useRouter } from "@/i18n/navigation";

export function DeleteContest({ contestId }: { contestId: string }) {
  const { mutate: deleteContest, isPending } = useDeleteContest();
  const router = useRouter();

  function handleDelete() {
    deleteContest(contestId, {
      onError(error) {
        toast.error("Failed to delete contest", { description: error.message });
      },
      onSuccess() {
        toast.success("Contest deleted");
        router.push("/contests");
      },
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={isPending}>
          {isPending ? (
            <Loader className="animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Delete Contest
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this contest?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. All problems, submissions, and participants will be removed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
