"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  lessonConstraint,
  type StructuralConstraintRuleType,
} from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function updateStructuralConstraint(input: {
  id: string;
  ruleType: StructuralConstraintRuleType;
  ruleParams: Record<string, unknown>;
}) {
  const currentUser = await getCurrentUser({});

  const existing = await db.query.lessonConstraint.findFirst({
    where: eq(lessonConstraint.id, input.id),
    with: { lesson: { with: { track: { columns: { createdBy: true } } } } },
  });

  if (
    !existing ||
    existing.kind !== "structural" ||
    existing.lesson.track.createdBy !== currentUser.id
  ) {
    throw new Error("Constraint not found.");
  }

  const [updated] = await db
    .update(lessonConstraint)
    .set({
      ruleType: input.ruleType,
      ruleParams: JSON.stringify(input.ruleParams),
    })
    .where(eq(lessonConstraint.id, input.id))
    .returning();

  return updated;
}
