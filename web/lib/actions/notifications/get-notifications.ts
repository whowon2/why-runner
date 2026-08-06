"use server";

import { eq, inArray } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { notification, user } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function getNotifications() {
  const currentUser = await getCurrentUser({});

  const notifications = await db.query.notification.findMany({
    where: eq(notification.recipientId, currentUser.id),
    orderBy: (n, { desc }) => desc(n.updatedAt),
    limit: 50,
    with: {
      activity: { columns: { id: true } },
      contest: { columns: { id: true, name: true, slug: true } },
      submission: { columns: { id: true, status: true } },
      problem: { columns: { id: true, title: true, slug: true } },
      lesson: { columns: { id: true, problemId: true } },
    },
  });

  const actorIds = [...new Set(notifications.flatMap((n) => n.actorIds))];
  const actors = actorIds.length
    ? await db.query.user.findMany({
        where: inArray(user.id, actorIds),
        columns: { id: true, name: true, username: true, image: true },
      })
    : [];
  const actorsById = new Map(actors.map((a) => [a.id, a]));

  return notifications.map((n) => ({
    ...n,
    actors: n.actorIds.map((id) => actorsById.get(id)).filter((a) => !!a),
  }));
}
