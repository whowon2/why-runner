"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  lessonConstraint,
  type StructuralConstraintRuleType,
} from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function createStructuralConstraint(input: {
  lessonId: string;
  ruleType: StructuralConstraintRuleType;
  ruleParams: Record<string, unknown>;
}) {
  const currentUser = await getCurrentUser({});

  const owned = await db.query.lesson.findFirst({
    where: (l, { eq }) => eq(l.id, input.lessonId),
    with: { track: { columns: { createdBy: true } } },
  });

  if (!owned || owned.track.createdBy !== currentUser.id) {
    throw new Error("Lesson not found.");
  }

  // At most one row per rule type per lesson (also enforced by the DB's
  // `lesson_constraint_one_per_rule_type` unique index) — edit the existing
  // row via `updateStructuralConstraint` instead of adding a duplicate.
  const existing = await db.query.lessonConstraint.findFirst({
    where: and(
      eq(lessonConstraint.lessonId, input.lessonId),
      eq(lessonConstraint.ruleType, input.ruleType),
    ),
    columns: { id: true },
  });
  if (existing) {
    throw new Error(
      "This lesson already has a rule of that type — edit it instead of adding another.",
    );
  }

  const [created] = await db
    .insert(lessonConstraint)
    .values({
      lessonId: input.lessonId,
      kind: "structural",
      ruleType: input.ruleType,
      ruleParams: JSON.stringify(input.ruleParams),
    })
    .returning();

  return created;
}
