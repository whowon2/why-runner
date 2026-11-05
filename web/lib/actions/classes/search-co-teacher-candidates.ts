"use server";

import { and, eq, like, ne, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import {
  type ClassroomRole,
  classroomMembership,
  user,
} from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { assertClassOwner } from "@/lib/auth/permissions";

const schema = z.object({
  classroomId: z.uuid(),
  query: z
    .string()
    .trim()
    .transform((q) => q.replace(/^@/, ""))
    .pipe(z.string().min(2).max(320)),
});

export type CoTeacherCandidate = {
  id: string;
  name: string;
  username: string;
  image: string | null;
  membershipRole: ClassroomRole | null;
  isOwner: boolean;
  /** Only set when the query was this user's exact email. */
  email?: string;
};

/** Escapes LIKE wildcards so the query is matched literally. */
function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/**
 * Owner-level (owner or admin): users the "Add co-teacher" combobox may
 * suggest. A query with an `@` after the first character is treated as an
 * email and matched exactly (case-insensitive), so emails can't be
 * enumerated by prefix; anything else is a prefix match on the username or
 * the name. Each row carries its membership in this class.
 */
export async function searchCoTeacherCandidates(
  input: z.input<typeof schema>,
): Promise<CoTeacherCandidate[]> {
  const { classroomId, query } = schema.parse(input);
  const currentUser = await getCurrentUser({});
  const { classroom } = await assertClassOwner(classroomId, currentUser.id);

  // `query` has its leading @ stripped, so an @ anywhere in it means the
  // original had one after the first character.
  const isEmail = query.includes("@");
  const lowered = query.toLowerCase();
  const prefix = `${escapeLike(lowered)}%`;

  const match = isEmail
    ? eq(sql`lower(${user.email})`, lowered)
    : or(
        like(sql`lower(${user.username})`, prefix),
        like(sql`lower(${user.name})`, prefix),
      );

  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      email: user.email,
      membershipRole: classroomMembership.role,
    })
    .from(user)
    .leftJoin(
      classroomMembership,
      and(
        eq(classroomMembership.userId, user.id),
        eq(classroomMembership.classroomId, classroomId),
      ),
    )
    .where(and(match, ne(user.id, currentUser.id)))
    .orderBy(user.username)
    .limit(8);

  return rows.map(({ email, ...row }) => ({
    ...row,
    isOwner: row.id === classroom.createdBy,
    ...(isEmail ? { email } : {}),
  }));
}
