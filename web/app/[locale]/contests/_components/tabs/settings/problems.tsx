"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Loader, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  Contest,
  ProblemOnContest,
  ProblemPreview,
} from "@/drizzle/schema";
import { useAddProblemToContest } from "@/hooks/use-add-problem";
import { useProblems } from "@/hooks/use-problems";
import { useRemoveProblemToContest as useRemoveProblemFromContest } from "@/hooks/use-remove-problem";
import { Link, usePathname } from "@/i18n/navigation";
import { reorderProblems } from "@/lib/actions/contest/reorder-problems";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function EditContestProblems({
  contest,
}: {
  contest: Contest & {
    problems: ProblemOnContest[];
  };
}) {
  const t = useTranslations("ContestsPage.Tabs.Settings.Problems");
  const { data: problems } = useProblems({ page: 1, pageSize: 10 });
  const { mutate: addProblem, isPending: isAddPending } =
    useAddProblemToContest();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const canReorder = !contest.startDate || new Date() < contest.startDate;

  const sorted = [...contest.problems].sort((a, b) => a.order - b.order);
  const [localOrder, setLocalOrder] = useState<string[]>(
    sorted.map((p) => p.problemId),
  );
  const [isSaving, setIsSaving] = useState(false);

  const orderedProblems = localOrder
    .map((id) => contest.problems.find((p) => p.problemId === id))
    .filter(Boolean) as ProblemOnContest[];

  function move(index: number, direction: -1 | 1) {
    const next = [...localOrder];
    const swap = index + direction;
    [next[index], next[swap]] = [next[swap], next[index]];
    setLocalOrder(next);
  }

  async function handleSaveOrder() {
    setIsSaving(true);
    try {
      await reorderProblems(contest.id, localOrder);
      toast.success(t("orderSaved"));
      queryClient.invalidateQueries({
        queryKey: ["contest", String(contest.id)],
      });
    } catch (e) {
      toast.error(t("orderError"), {
        description: e instanceof Error ? e.message : String(e),
      });
    } finally {
      setIsSaving(false);
    }
  }

  const orderChanged =
    localOrder.join() !== sorted.map((p) => p.problemId).join();

  function handleProblemSelect(id: string) {
    addProblem(
      { contestId: contest.id, problemId: id },
      {
        onError(error) {
          toast.error(t("addError"), { description: error.message });
        },
        onSuccess() {
          toast.success(t("addSuccess"));
          queryClient.invalidateQueries({
            queryKey: ["contest", String(contest.id)],
          });
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex w-full gap-2">
        <Select
          disabled={isAddPending}
          onValueChange={handleProblemSelect}
          value={""}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={t("placeholder")} />
          </SelectTrigger>
          <SelectContent>
            {problems?.data
              ?.filter(
                (p) => !contest.problems.find((poc) => poc.problemId === p.id),
              )
              .map((p) => (
                <SelectItem className="w-full" key={p.id} value={String(p.id)}>
                  {p.title}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <Link href={`/problems/new?callback=${pathname}`}>
          <Button type="button">{t("create")}</Button>
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {orderedProblems.map((probOnCont, index) => (
          <div
            className="flex items-center justify-between rounded-none border p-2"
            key={probOnCont.problemId}
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-none bg-muted font-bold text-sm">
                {LETTERS[index] ?? index + 1}
              </span>
              <p>{probOnCont.problem.title}</p>
            </div>
            <div className="flex items-center gap-1">
              {canReorder && (
                <>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    disabled={index === orderedProblems.length - 1}
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                </>
              )}
              <RemoveProblemButton
                contest={contest}
                problem={probOnCont.problem}
              />
            </div>
          </div>
        ))}
      </div>

      {canReorder && orderChanged && (
        <Button onClick={handleSaveOrder} disabled={isSaving}>
          {isSaving ? <Loader className="animate-spin" /> : t("saveOrder")}
        </Button>
      )}
    </div>
  );
}

function RemoveProblemButton({
  problem,
  contest,
}: {
  problem: ProblemPreview;
  contest: Contest;
}) {
  const t = useTranslations("ContestsPage.Tabs.Settings.Problems");
  const { mutate: removeProblem, isPending: isRemovePending } =
    useRemoveProblemFromContest();
  const queryClient = useQueryClient();

  function handleRemoveProblem(id: string) {
    removeProblem(
      { contestId: contest.id, problemId: id },
      {
        onError(error) {
          toast.error(t("removeError"), { description: error.message });
        },
        onSuccess() {
          toast.success(t("removeSuccess"));
          queryClient.invalidateQueries({
            queryKey: ["contest", String(contest.id)],
          });
        },
      },
    );
  }

  return (
    <Button
      disabled={isRemovePending}
      onClick={() => handleRemoveProblem(problem.id)}
      variant="outline"
      size="icon"
    >
      {isRemovePending ? <Loader className="animate-spin" /> : <X />}
    </Button>
  );
}
