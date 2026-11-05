"use client";

import { Command as CommandPrimitive } from "cmdk";
import { Loader2, UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { type KeyboardEvent, type ReactNode, useRef, useState } from "react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Command, CommandItem, CommandList } from "@/components/ui/command";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { LoadingSwap } from "@/components/ui/loading-swap";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { useActionErrorMessage } from "@/hooks/use-action-error-message";
import { useAddCoTeacher } from "@/hooks/use-add-co-teacher";
import { useCoTeacherSearch } from "@/hooks/use-co-teacher-search";
import type { CoTeacherCandidate } from "@/lib/actions/classes/search-co-teacher-candidates";
import { cn } from "@/lib/utils";

/**
 * Owner-level only: add an existing user as co-teacher. The combobox
 * suggests users by username/name prefix (or exact email); a typed
 * username or email can still be submitted without picking a suggestion.
 */
export function AddCoTeacherDialog({ classroomId }: { classroomId: string }) {
  const t = useTranslations("ClassesPage");
  const tCommon = useTranslations("Common");
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CoTeacherCandidate | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const { mutate: addCoTeacher, isPending } = useAddCoTeacher();
  const errorMessage = useActionErrorMessage();
  const search = useCoTeacherSearch(classroomId, selected ? "" : query);

  function handleAdd() {
    const trimmed = query.trim();
    if (!selected && !trimmed) return;
    setListOpen(false);
    addCoTeacher(
      selected
        ? { classroomId, userId: selected.id }
        : { classroomId, usernameOrEmail: trimmed },
      {
        onError: (error) => toast.error(errorMessage(error)),
        onSuccess: () => {
          toast.success(t("addCoTeacherSuccess"));
          setOpen(false);
        },
      },
    );
  }

  function handleSelect(candidate: CoTeacherCandidate) {
    setSelected(candidate);
    setQuery(`@${candidate.username}`);
    setListOpen(false);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key !== "Enter") return;
    // cmdk picks the highlighted row on Enter; with no selectable row
    // highlighted (or the list closed), Enter submits what was typed.
    const highlighted = listRef.current?.querySelector(
      '[cmdk-item][aria-selected="true"]:not([aria-disabled="true"])',
    );
    if (listOpen && highlighted) return;
    e.preventDefault();
    handleAdd();
  }

  const typedLength = query.trim().replace(/^@/, "").length;
  const candidates = search.enabled ? (search.data ?? []) : [];
  const isLoading =
    search.enabled && (search.isDebouncing || search.isFetching);

  return (
    <Dialog
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setQuery("");
          setSelected(null);
          setListOpen(false);
        }
      }}
      open={open}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <UserPlus className="size-4" />
          {t("addCoTeacher")}
        </Button>
      </DialogTrigger>
      <DialogContent
        onEscapeKeyDown={(e) => {
          // The popover lives in another Radix layer stack, so both would
          // react to the same Esc: close only the suggestion list.
          if (!listOpen) return;
          e.preventDefault();
          setListOpen(false);
        }}
      >
        <DialogHeader>
          <DialogTitle>{t("addCoTeacherTitle")}</DialogTitle>
          <DialogDescription>{t("addCoTeacherDescription")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="co-teacher">{t("addCoTeacherLabel")}</Label>
          {/* Results come from the server, so cmdk's own filter is off. */}
          <Command
            className="overflow-visible bg-transparent"
            label={t("addCoTeacherLabel")}
            onKeyDown={handleKeyDown}
            shouldFilter={false}
          >
            <Popover onOpenChange={setListOpen} open={listOpen}>
              <PopoverAnchor asChild>
                <div className="relative">
                  <CommandPrimitive.Input
                    className={cn(
                      "placeholder:text-muted-foreground dark:bg-input/30 border-input h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 pr-8 text-base outline-none transition-[color,box-shadow] md:text-sm",
                      "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
                    )}
                    id="co-teacher"
                    onFocus={() => {
                      if (query.trim() && !selected) setListOpen(true);
                    }}
                    onValueChange={(value) => {
                      setQuery(value);
                      setSelected(null);
                      setListOpen(value.trim().length > 0);
                    }}
                    placeholder={t("addCoTeacherPlaceholder")}
                    value={query}
                  />
                  {isLoading && (
                    <Loader2 className="text-muted-foreground absolute top-1/2 right-2.5 size-4 -translate-y-1/2 animate-spin" />
                  )}
                </div>
              </PopoverAnchor>
              <PopoverContent
                align="start"
                className="w-(--radix-popover-trigger-width) p-0"
                onInteractOutside={(e) => {
                  // Clicking back into the input keeps the list open.
                  if (
                    e.target instanceof Element &&
                    e.target.closest("[cmdk-input]")
                  )
                    e.preventDefault();
                }}
                onOpenAutoFocus={(e) => e.preventDefault()}
                portal={false}
              >
                <CommandList ref={listRef}>
                  {typedLength < 2 ? (
                    <CoTeacherListMessage>
                      {t("coTeacherSearchTypeMore")}
                    </CoTeacherListMessage>
                  ) : candidates.length === 0 ? (
                    <CoTeacherListMessage>
                      {isLoading
                        ? t("coTeacherSearchLoading")
                        : t("coTeacherSearchEmpty")}
                    </CoTeacherListMessage>
                  ) : (
                    <div className="p-1">
                      {candidates.map((c) => (
                        <CoTeacherRow
                          candidate={c}
                          key={c.id}
                          onSelect={() => handleSelect(c)}
                        />
                      ))}
                    </div>
                  )}
                </CommandList>
              </PopoverContent>
            </Popover>
          </Command>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{tCommon("cancel")}</Button>
          </DialogClose>
          <Button
            disabled={isPending || (!selected && !query.trim())}
            onClick={handleAdd}
          >
            <LoadingSwap isLoading={isPending}>
              {t("addCoTeacherSubmit")}
            </LoadingSwap>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CoTeacherListMessage({ children }: { children: ReactNode }) {
  return (
    <div className="text-muted-foreground px-3 py-6 text-center text-sm">
      {children}
    </div>
  );
}

function CoTeacherRow({
  candidate,
  onSelect,
}: {
  candidate: CoTeacherCandidate;
  onSelect: () => void;
}) {
  const t = useTranslations("ClassesPage");
  const isCoTeacher = candidate.membershipRole === "teacher";
  const disabled = candidate.isOwner || isCoTeacher;

  return (
    <CommandItem
      className="gap-3"
      disabled={disabled}
      onSelect={onSelect}
      value={candidate.id}
    >
      <Avatar className="size-7 shrink-0">
        {candidate.image && <AvatarImage alt="" src={candidate.image} />}
        <AvatarFallback className="text-[10px]">
          {candidate.name.slice(0, 2).toUpperCase()}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{candidate.name}</span>
        <span className="text-muted-foreground truncate text-xs">
          @{candidate.username}
          {candidate.email && ` · ${candidate.email}`}
        </span>
      </div>
      {candidate.isOwner ? (
        <Badge variant="secondary">{t("coTeacherBadgeOwner")}</Badge>
      ) : isCoTeacher ? (
        <Badge variant="secondary">{t("coTeacherBadgeAlready")}</Badge>
      ) : candidate.membershipRole === "student" ? (
        <Badge variant="outline">{t("coTeacherBadgeStudent")}</Badge>
      ) : null}
    </CommandItem>
  );
}
