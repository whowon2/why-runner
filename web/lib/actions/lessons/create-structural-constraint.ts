"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  exerciseConstraint,
  type StructuralConstraintRuleType,
} from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function createStructuralConstraint(input: {
  exerciseId: string;
  ruleType: StructuralConstraintRuleType;
  ruleParams: Record<string, unknown>;
}) {
  const currentUser = await getCurrentUser({});

  const owned = await db.query.exercise.findFirst({
    where: (e, { eq }) => eq(e.id, input.exerciseId),
    with: { lesson: { columns: { createdBy: true } } },
  });

  if (!owned || owned.lesson.createdBy !== currentUser.id) {
    throw new Error("Exercise not found.");
  }

  // At most one row per rule type per exercise (also enforced by the DB's
  // `exercise_constraint_one_per_rule_type` unique index) — edit the
  // existing row via `updateStructuralConstraint` instead of adding a
  // duplicate.
  const existing = await db.query.exerciseConstraint.findFirst({
    where: and(
      eq(exerciseConstraint.exerciseId, input.exerciseId),
      eq(exerciseConstraint.ruleType, input.ruleType),
    ),
    columns: { id: true },
  });
  if (existing) {
    throw new Error(
      "This exercise already has a rule of that type — edit it instead of adding another.",
    );
  }

  const [created] = await db
    .insert(exerciseConstraint)
    .values({
      exerciseId: input.exerciseId,
      kind: "structural",
      ruleType: input.ruleType,
      ruleParams: JSON.stringify(input.ruleParams),
    })
    .returning();

  return created;
}
