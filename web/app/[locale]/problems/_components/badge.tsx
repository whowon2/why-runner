import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { ProblemDifficulty } from "@/drizzle/schema";

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
