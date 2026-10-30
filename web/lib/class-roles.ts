import type { ClassroomRole } from "@/drizzle/schemas/classes";

/**
 * A user's relation to a class. `owner` is `classroom.createdBy`, `teacher`
 * and `student` come from the membership row, `admin` is a platform admin
 * with no closer relation. Pure, so the permission matrix is unit-tested.
 */
export type ClassRole = "owner" | "teacher" | "student" | "admin";

export function resolveClassRole(input: {
  userId: string;
  createdBy: string;
  membershipRole: ClassroomRole | null;
  admin: boolean;
}): ClassRole | null {
  if (input.createdBy === input.userId) return "owner";
  if (input.membershipRole === "teacher") return "teacher";
  if (input.admin) return "admin";
  if (input.membershipRole === "student") return "student";
  return null;
}

/** Lessons, exercises, gradebook, export, similarity, review, roster, rename, removing students. */
export function canManageClass(role: ClassRole | null): boolean {
  return role === "owner" || role === "teacher" || role === "admin";
}

/** Owner-level powers: delete the class and add, promote, demote or remove co-teachers. */
export function isClassOwner(role: ClassRole | null): boolean {
  return role === "owner" || role === "admin";
}

/** Students of a class: `student` memberships, never the owner's own row. */
export function isClassStudent(
  membership: { userId: string; role: ClassroomRole },
  createdBy: string,
): boolean {
  return membership.role === "student" && membership.userId !== createdBy;
}
