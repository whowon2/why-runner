"use server";

import { count, desc, eq, ilike } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { contest, user } from "@/drizzle/schema";
import { type AdminListParams, adminListSchema } from "@/lib/admin/list-params";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { assertAdmin } from "@/lib/auth/permissions";

/** Admin only: every contest, drafts included. */
export async function listAllContests(params: AdminListParams) {
  const currentUser = await getCurrentUser({});
  await assertAdmin(currentUser.id);
  const { page, pageSize, search } = adminListSchema.parse(params);

  const where = search ? ilike(contest.name, `%${search}%`) : undefined;

  const [data, [{ total }]] = await Promise.all([
    db
      .select({
        id: contest.id,
        name: contest.name,
        slug: contest.slug,
        status: contest.status,
        startDate: contest.startDate,
        endDate: contest.endDate,
        owner: { name: user.name, username: user.username },
      })
      .from(contest)
      .leftJoin(user, eq(user.id, contest.createdBy))
      .where(where)
      .orderBy(desc(contest.createdAt))
      .limit(pageSize)
      .offset((page - 1) * pageSize),
    db.select({ total: count() }).from(contest).where(where),
  ]);

  return { data, total };
}
