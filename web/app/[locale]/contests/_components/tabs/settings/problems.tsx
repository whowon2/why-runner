"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ChevronsUpDown, Loader, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type {
  Contest,
  ProblemOnContest,
  ProblemPreview,
} from "@/drizzle/schema";
import { CreateProblemButton } from "@/app/[locale]/problems/_components/create-button";
import { useAddProblemToContest } from "@/hooks/use-add-problem";
import { useProblems } from "@/hooks/use-problems";
import { useRemoveProblemToContest as useRemoveProblemFromContest } from "@/hooks/use-remove-problem";
import { Link } from "@/i18n/navigation";
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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timeout);
  }, [search]);
  const { data: problems, isFetching: isSearching } = useProblems({
    page: 1,
    pageSize: 20,
    search: debouncedSearch || undefined,
  });
  const { mutate: addProblem, isPending: isAddPending } =
    useAddProblemToContest();
  const queryClient = useQueryClient();
  const canReorder = !contest.startDate || new Date() < contest.startDate;

  const sorted = [...contest.problems].sort((a, b) => a.order - b.order);
  const [localOrder, setLocalOrder] = useState<string[]>(
    sorted.map((p) => p.problemId),
  );
  const [isSaving, setIsSaving] = useState(false);

  const membershipKey = sorted
    .map((p) => p.problemId)
    .sort()
    .join(",");
  const prevMembershipKey = useRef(membershipKey);

  useEffect(() => {
    if (membershipKey !== prevMembershipKey.current) {
      prevMembershipKey.current = membershipKey;
      setLocalOrder(sorted.map((p) => p.problemId));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [membershipKey]);

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
    setPickerOpen(false);
    setSearch("");
    addProblem(
      { contestId: contest.id, problemId: id },
      {
        onError(error) {
          toast.error(t("addError"), { description: error.message });
        },
        onSuccess() {
          toast.success(t("addSuccess"));
        },
      },
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex w-full gap-2">
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={pickerOpen}
              disabled={isAddPending}
              className="flex-1 justify-between font-normal text-muted-foreground"
            >
              {t("placeholder")}
              <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-(--radix-popover-trigger-width) p-0"
            align="start"
          >
            {/* Search runs server-side on title and code, so cmdk's own filter is off. */}
            <Command shouldFilter={false}>
              <CommandInput
                placeholder={t("searchPlaceholder")}
                value={search}
                onValueChange={setSearch}
              />
              <CommandList>
                <CommandEmpty>
                  {isSearching ? t("searching") : t("empty")}
                </CommandEmpty>
                {problems?.data
                  ?.filter(
                    (p) =>
                      !contest.problems.find((poc) => poc.problemId === p.id),
                  )
                  .map((p) => (
                    <CommandItem
                      key={p.id}
                      value={String(p.id)}
                      onSelect={() => handleProblemSelect(String(p.id))}
                    >
                      <span className="font-mono text-xs text-muted-foreground">
                        [{p.code}]
                      </span>
                      <span className="truncate">{p.title}</span>
                      {p.creatorName && (
                        <span className="text-xs text-muted-foreground">
                          {t("by")} {p.creatorName}
                        </span>
                      )}
                    </CommandItem>
                  ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <CreateProblemButton />
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
              <div className="flex items-center gap-1.5">
                <Link
                  className="flex items-center gap-1.5 hover:underline"
                  href={`/problems/${probOnCont.problem.slug}`}
                >
                  <span className="font-mono text-xs text-muted-foreground">
                    [{probOnCont.problem.code}]
                  </span>
                  <p>{probOnCont.problem.title}</p>
                </Link>
                {probOnCont.problem.user && (
                  <Link
                    className="text-xs text-muted-foreground hover:underline"
                    href={`/user/${probOnCont.problem.user.username}`}
                  >
                    {t("by")} {probOnCont.problem.user.name}
                  </Link>
                )}
              </div>
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

  function handleRemoveProblem(id: string) {
    removeProblem(
      { contestId: contest.id, problemId: id },
      {
        onError(error) {
          toast.error(t("removeError"), { description: error.message });
        },
        onSuccess() {
          toast.success(t("removeSuccess"));
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
