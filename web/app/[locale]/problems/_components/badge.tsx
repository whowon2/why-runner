import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { ProblemDifficulty, ProblemTag } from "@/drizzle/schema";

export function DraftBadge() {
  const t = useTranslations("ProblemsPage");

  return (
    <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-none border border-amber-500/40 text-amber-600 dark:text-amber-400 bg-amber-500/10">
      {t("draftBadge")}
    </span>
  );
}

export function DifficultyBadge({
  difficulty,
}: {
  difficulty: ProblemDifficulty | "none" | null;
}) {
  const t = useTranslations();

  return (
    <Badge className={getColor(difficulty ?? "none")}>
      {t(`Difficults.${difficulty ?? "none"}`)}
    </Badge>
  );
}

export function ProblemTags({
  tags,
  max,
}: {
  tags: ProblemTag[];
  // Rows in the list stay compact: show the first `max` tags plus a "+N".
  max?: number;
}) {
  const t = useTranslations("ProblemTags");

  if (tags.length === 0) return null;

  const visible = max === undefined ? tags : tags.slice(0, max);
  const hidden = tags.length - visible.length;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((tag) => (
        <Badge key={tag} variant="outline" className="text-muted-foreground">
          {t(tag)}
        </Badge>
      ))}
      {hidden > 0 && (
        <Badge
          variant="outline"
          className="text-muted-foreground"
          title={tags
            .slice(visible.length)
            .map((tag) => t(tag))
            .join(", ")}
        >
          +{hidden}
        </Badge>
      )}
    </div>
  );
}

function getColor(difficulty: string) {
  switch (difficulty.toLocaleLowerCase()) {
    case "easy":
      return "bg-green-400";
    case "medium":
      return "bg-orange-400";
    case "hard":
      return "bg-red-400";
    default:
      return "bg-gray-400";
  }
}
