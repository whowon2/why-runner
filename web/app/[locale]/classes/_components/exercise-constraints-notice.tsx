"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useExerciseConstraints } from "@/hooks/use-exercise-constraints";

// Read-only, shown to every class member so students know what's expected
// *before* they submit, not just after a violation. Mutation UI (add/edit/
// remove) stays in the owner-only dialog on the lesson page.
export function ExerciseConstraintsNotice({
  exerciseId,
}: {
  exerciseId: string;
}) {
  const t = useTranslations("RoadmapPage.Constraints");
  const { data: constraints } = useExerciseConstraints(exerciseId);

  if (!constraints || constraints.length === 0) return null;

  return (
    <Card className="bg-transparent shadow-none">
      <CardHeader>
        <CardTitle className="text-base">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 text-sm">
        {constraints.map((c) => {
          if (c.kind === "algorithm_requirement") {
            return (
              <p key={c.id}>
                <span className="font-medium">{t("algorithmTitle")}:</span>{" "}
                {c.description}
              </p>
            );
          }

          let params: Record<string, unknown> = {};
          try {
            params = c.ruleParams ? JSON.parse(c.ruleParams) : {};
          } catch {
            params = {};
          }

          const constructs = Array.isArray(params.constructs)
            ? params.constructs.join(", ")
            : "?";

          let label: string;
          switch (c.ruleType) {
            case "max_loop_nesting_depth":
              label = `${t("maxLoopNestingDepth")}: ${params.maxDepth ?? "?"}`;
              break;
            case "required_construct":
              label = `${t("requiredConstruct")}: ${constructs}`;
              break;
            default:
              label = `${t("forbiddenConstruct")}: ${constructs}`;
          }

          return <p key={c.id}>{label}</p>;
        })}
      </CardContent>
    </Card>
  );
}
