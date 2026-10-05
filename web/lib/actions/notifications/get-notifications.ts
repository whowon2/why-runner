"use server";

import { eq, inArray } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { exercise, notification, user } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export async function getNotifications() {
  const currentUser = await getCurrentUser({});

  const notifications = await db.query.notification.findMany({
    where: eq(notification.recipientId, currentUser.id),
    orderBy: (n, { desc }) => desc(n.updatedAt),
    limit: 50,
    with: {
      contest: { columns: { id: true, name: true, slug: true } },
      submission: { columns: { id: true, status: true, exerciseId: true } },
      problem: { columns: { id: true, title: true, slug: true } },
      exercise: { columns: { id: true, problemId: true } },
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

  // A graded lesson-exercise submission links to its exercise page, not the
  // problem page: lesson problems may be drafts, which the problem page only
  // shows to their owner (students would get a 404).
  const exerciseIds = [
    ...new Set(
      notifications.flatMap((n) =>
        n.submission?.exerciseId ? [n.submission.exerciseId] : [],
      ),
    ),
  ];
  const exercises = exerciseIds.length
    ? await db.query.exercise.findMany({
        where: inArray(exercise.id, exerciseIds),
        columns: { id: true, slug: true },
        with: {
          lesson: {
            columns: { slug: true },
            with: { classroom: { columns: { slug: true } } },
          },
        },
      })
    : [];
  const exerciseHrefById = new Map(
    exercises.map((e) => [
      e.id,
      `/classes/${e.lesson.classroom.slug}/lessons/${e.lesson.slug}/exercises/${e.slug}`,
    ]),
  );

  return notifications.map((n) => ({
    ...n,
    actors: n.actorIds.map((id) => actorsById.get(id)).filter((a) => !!a),
    exerciseHref: n.submission?.exerciseId
      ? (exerciseHrefById.get(n.submission.exerciseId) ?? null)
      : null,
  }));
}
