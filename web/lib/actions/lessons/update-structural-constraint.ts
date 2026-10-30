"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  exerciseConstraint,
  type StructuralConstraintRuleType,
} from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { assertCanManageExercise } from "@/lib/auth/permissions";

export async function updateStructuralConstraint(input: {
  id: string;
  ruleType: StructuralConstraintRuleType;
  ruleParams: Record<string, unknown>;
}) {
  const currentUser = await getCurrentUser({});

  const existing = await db.query.exerciseConstraint.findFirst({
    where: eq(exerciseConstraint.id, input.id),
  });

  if (!existing || existing.kind !== "structural") {
    throw new Error("Constraint not found.");
  }
  await assertCanManageExercise(existing.exerciseId, currentUser.id);

  const [updated] = await db
    .update(exerciseConstraint)
    .set({
      ruleType: input.ruleType,
      ruleParams: JSON.stringify(input.ruleParams),
    })
    .where(eq(exerciseConstraint.id, input.id))
    .returning();

  return updated;
}
