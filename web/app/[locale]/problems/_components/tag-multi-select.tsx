import { Check, ChevronsUpDown, Tags } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { PROBLEM_TAG_GROUPS, type ProblemTag } from "@/drizzle/schema";
import { cn } from "@/lib/utils";

export function TagMultiSelect({
  value,
  onChange,
  label,
  className,
  disabled,
}: {
  value: ProblemTag[];
  onChange: (tags: ProblemTag[]) => void;
  // Trigger text when nothing is selected; defaults to the picker placeholder.
  label?: string;
  className?: string;
  disabled?: boolean;
}) {
  const t = useTranslations("ProblemsPage.TagPicker");
  const tTags = useTranslations("ProblemTags");

  function toggle(tag: ProblemTag) {
    onChange(
      value.includes(tag) ? value.filter((v) => v !== tag) : [...value, tag],
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          disabled={disabled}
          className={cn("justify-between font-normal", className)}
        >
          <span className="flex items-center gap-2 truncate">
            <Tags className="h-4 w-4 shrink-0" />
            {label ?? t("placeholder")}
            {value.length > 0 && ` (${value.length})`}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={t("search")} />
          <CommandList>
            <CommandEmpty>{t("empty")}</CommandEmpty>
            {(
              Object.entries(PROBLEM_TAG_GROUPS) as [
                keyof typeof PROBLEM_TAG_GROUPS,
                readonly ProblemTag[],
              ][]
            ).map(([group, tags]) => (
              <CommandGroup key={group} heading={t(`groups.${group}`)}>
                {tags.map((tag) => (
                  <CommandItem
                    key={tag}
                    // cmdk filters on `value`; use the localized label so
                    // search matches what the user sees.
                    value={`${tTags(tag)} ${tag}`}
                    onSelect={() => toggle(tag)}
                  >
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value.includes(tag) ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {tTags(tag)}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
            {value.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value="__clear__"
                    onSelect={() => onChange([])}
                    className="justify-center"
                  >
                    {t("clear")}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
