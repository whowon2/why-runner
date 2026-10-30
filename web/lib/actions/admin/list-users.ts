"use server";

import { asc, count, ilike, or } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { user } from "@/drizzle/schema";
import { type AdminListParams, adminListSchema } from "@/lib/admin/list-params";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { assertAdmin } from "@/lib/auth/permissions";

/**
 * Admin only: users searchable by name, username or email. This is the one
 * place emails leave the server for other users' rows (admin-only page).
 */
export async function listUsers(params: AdminListParams) {
  const currentUser = await getCurrentUser({});
  await assertAdmin(currentUser.id);
  const { page, pageSize, search } = adminListSchema.parse(params);

  const pattern = `%${search}%`;
  const where = search
    ? or(
        ilike(user.name, pattern),
        ilike(user.username, pattern),
        ilike(user.email, pattern),
      )
    : undefined;

  const [data, [{ total }]] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        image: user.image,
        role: user.role,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(where)
      .orderBy(asc(user.name))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(user).where(where),
  ]);

  return { data, total, currentUserId: currentUser.id };
}
