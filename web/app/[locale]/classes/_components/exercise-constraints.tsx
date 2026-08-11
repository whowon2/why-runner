"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import type {
  ProblemConstraint,
  StructuralConstraintRuleType,
} from "@/drizzle/schema";
import { useCreateStructuralConstraint } from "@/hooks/use-create-structural-constraint";
import { useDeleteExerciseConstraint } from "@/hooks/use-delete-exercise-constraint";
import { useExerciseConstraints } from "@/hooks/use-exercise-constraints";
import { useUpdateStructuralConstraint } from "@/hooks/use-update-structural-constraint";
import { useUpsertAlgorithmRequirementConstraint } from "@/hooks/use-upsert-algorithm-requirement-constraint";

// Solution constraints are an exercise-only feature: they attach to one
// exercise entry (one problem inside one lesson), never to the problem
// itself, and never apply to contests or standalone practice submissions.
export function ExerciseConstraintsPanel({ exerciseId }: { exerciseId: string }) {
  const t = useTranslations("RoadmapPage.Constraints");
  const { data: constraints, isPending } = useExerciseConstraints(exerciseId);

  const structural = (constraints ?? []).filter((c) => c.kind === "structural");
  const algorithm = (constraints ?? []).find(
    (c) => c.kind === "algorithm_requirement",
  );

  if (isPending) {
    return <Skeleton className="h-40 w-full" />;
  }

  return (
    <div className="flex flex-col gap-4 rounded-none border p-4">
      <div>
        <h3 className="font-semibold text-lg">{t("title")}</h3>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>

      <div className="flex flex-col gap-3">
        <h4 className="font-medium text-sm">{t("structuralTitle")}</h4>
        {structural.length === 0 && (
          <p className="text-muted-foreground text-xs">
            {t("noStructuralRules")}
          </p>
        )}
        {structural.map((constraint) => (
          <StructuralConstraintRow
            constraint={constraint}
            exerciseId={exerciseId}
            key={constraint.id}
          />
        ))}
        <NewStructuralConstraintRow
          existingRuleTypes={structural.map((c) => c.ruleType)}
          exerciseId={exerciseId}
        />
      </div>

      <AlgorithmRequirementRow
        existing={algorithm ?? null}
        exerciseId={exerciseId}
      />
    </div>
  );
}

const STRUCTURAL_RULE_TYPES: StructuralConstraintRuleType[] = [
  "max_loop_nesting_depth",
  "forbidden_construct",
  "required_construct",
];

function ruleTypeLabel(
  t: ReturnType<typeof useTranslations>,
  ruleType: StructuralConstraintRuleType,
) {
  switch (ruleType) {
    case "max_loop_nesting_depth":
      return t("maxLoopNestingDepth");
    case "forbidden_construct":
      return t("forbiddenConstruct");
    case "required_construct":
      return t("requiredConstruct");
  }
}

function parseParams(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function StructuralConstraintRow({
  constraint,
  exerciseId,
}: {
  constraint: ProblemConstraint;
  exerciseId: string;
}) {
  const t = useTranslations("RoadmapPage.Constraints");
  const { mutate: update, isPending: isSaving } =
    useUpdateStructuralConstraint();
  const { mutate: remove, isPending: isRemoving } =
    useDeleteExerciseConstraint();

  const params = parseParams(constraint.ruleParams);
  const ruleType = constraint.ruleType ?? "max_loop_nesting_depth";
  const [maxDepth, setMaxDepth] = useState(String(params.maxDepth ?? "1"));
  const [constructs, setConstructs] = useState(
    Array.isArray(params.constructs) ? params.constructs.join(", ") : "",
  );

  function handleSave() {
    const ruleParams =
      ruleType === "max_loop_nesting_depth"
        ? { maxDepth: Number(maxDepth) || 0 }
        : {
            constructs: constructs
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean),
          };

    update(
      { id: constraint.id, exerciseId, ruleType, ruleParams },
      { onError: (e) => toast.error(t("addFailed"), { description: e.message }) },
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border p-2">
      <span className="min-w-[220px] text-sm">
        {ruleTypeLabel(t, ruleType)}
      </span>
      {ruleType === "max_loop_nesting_depth" ? (
        <Input
          className="w-24"
          onChange={(e) => setMaxDepth(e.target.value)}
          type="number"
          value={maxDepth}
        />
      ) : (
        <Input
          onChange={(e) => setConstructs(e.target.value)}
          placeholder={t("constructsPlaceholder")}
          value={constructs}
        />
      )}
      <Button
        disabled={isSaving}
        onClick={handleSave}
        size="sm"
        type="button"
        variant="secondary"
      >
        {t("save")}
      </Button>
      <Button
        disabled={isRemoving}
        onClick={() =>
          remove(
            { id: constraint.id, exerciseId },
            {
              onError: (e) =>
                toast.error(t("removeFailed"), { description: e.message }),
            },
          )
        }
        size="icon"
        type="button"
        variant="ghost"
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
}

function NewStructuralConstraintRow({
  exerciseId,
  existingRuleTypes,
}: {
  exerciseId: string;
  existingRuleTypes: (StructuralConstraintRuleType | null)[];
}) {
  const t = useTranslations("RoadmapPage.Constraints");
  const { mutate: create, isPending } = useCreateStructuralConstraint();
  const availableRuleTypes = STRUCTURAL_RULE_TYPES.filter(
    (rt) => !existingRuleTypes.includes(rt),
  );
  const [ruleType, setRuleType] = useState<StructuralConstraintRuleType>(
    availableRuleTypes[0] ?? "max_loop_nesting_depth",
  );
  const [maxDepth, setMaxDepth] = useState("1");
  const [constructs, setConstructs] = useState("");

  if (availableRuleTypes.length === 0) return null;

  function handleAdd() {
    const ruleParams =
      ruleType === "max_loop_nesting_depth"
        ? { maxDepth: Number(maxDepth) || 0 }
        : {
            constructs: constructs
              .split(",")
              .map((c) => c.trim())
              .filter(Boolean),
          };

    create(
      { exerciseId, ruleType, ruleParams },
      {
        onSuccess: () => {
          setMaxDepth("1");
          setConstructs("");
        },
        onError: (e) => toast.error(t("addFailed"), { description: e.message }),
      },
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border border-dashed p-2">
      <Select
        onValueChange={(v) => setRuleType(v as StructuralConstraintRuleType)}
        value={ruleType}
      >
        <SelectTrigger className="w-full max-w-[220px]">
          <SelectValue placeholder={t("ruleType")} />
        </SelectTrigger>
        <SelectContent>
          {availableRuleTypes.map((rt) => (
            <SelectItem key={rt} value={rt}>
              {ruleTypeLabel(t, rt)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {ruleType === "max_loop_nesting_depth" ? (
        <Input
          className="w-24"
          onChange={(e) => setMaxDepth(e.target.value)}
          type="number"
          value={maxDepth}
        />
      ) : (
        <Input
          onChange={(e) => setConstructs(e.target.value)}
          placeholder={t("constructsPlaceholder")}
          value={constructs}
        />
      )}
      <Button disabled={isPending} onClick={handleAdd} size="sm" type="button">
        {t("addRule")}
      </Button>
    </div>
  );
}

function AlgorithmRequirementRow({
  existing,
  exerciseId,
}: {
  existing: ProblemConstraint | null;
  exerciseId: string;
}) {
  const t = useTranslations("RoadmapPage.Constraints");
  const { mutate: upsert, isPending } =
    useUpsertAlgorithmRequirementConstraint();
  const { mutate: remove, isPending: isRemoving } =
    useDeleteExerciseConstraint();

  const [description, setDescription] = useState(existing?.description ?? "");

  useEffect(() => {
    setDescription(existing?.description ?? "");
  }, [existing?.description]);

  return (
    <div className="flex flex-col gap-2">
      <h4 className="font-medium text-sm">{t("algorithmTitle")}</h4>
      <Textarea
        onChange={(e) => setDescription(e.target.value)}
        placeholder={t("algorithmPlaceholder")}
        value={description}
      />
      <p className="text-muted-foreground text-xs">{t("algorithmHint")}</p>
      <div className="flex items-center gap-2">
        <Button
          disabled={isPending || !description.trim()}
          onClick={() =>
            upsert(
              { exerciseId, description },
              {
                onError: (e) =>
                  toast.error(t("addFailed"), { description: e.message }),
              },
            )
          }
          size="sm"
          type="button"
        >
          {t("save")}
        </Button>
        {existing && (
          <Button
            disabled={isRemoving}
            onClick={() =>
              remove(
                { id: existing.id, exerciseId },
                {
                  onSuccess: () => setDescription(""),
                  onError: (e) =>
                    toast.error(t("removeFailed"), { description: e.message }),
                },
              )
            }
            size="sm"
            type="button"
            variant="ghost"
          >
            {t("remove")}
          </Button>
        )}
      </div>
    </div>
  );
}
