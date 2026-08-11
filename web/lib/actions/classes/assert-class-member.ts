import { db } from "@/drizzle/db";
import { classroom, classroomMembership } from "@/drizzle/schema";
import { eq, and } from "drizzle-orm";

/** Throws unless the user owns the class or is a joined member of it. */
export async function assertClassMember(classroomId: string, userId: string) {
  const found = await db.query.classroom.findFirst({
    where: eq(classroom.id, classroomId),
  });
  if (!found) throw new Error("Class not found");
  if (found.createdBy === userId) return found;

  const membership = await db.query.classroomMembership.findFirst({
    where: and(
      eq(classroomMembership.classroomId, classroomId),
      eq(classroomMembership.userId, userId),
    ),
  });
  if (!membership) throw new Error("Not a member of this class");

  return found;
}

export async function assertClassOwner(classroomId: string, userId: string) {
  const found = await db.query.classroom.findFirst({
    where: eq(classroom.id, classroomId),
  });
  if (!found) throw new Error("Class not found");
  if (found.createdBy !== userId) throw new Error("Not the class owner");
  return found;
}
