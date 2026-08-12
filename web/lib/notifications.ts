import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  notification,
  notificationPreference,
  type NotificationType,
  userFollow,
} from "@/drizzle/schema";

const MAX_ACTORS = 5;

export async function isNotificationEnabled(
  userId: string,
  type: NotificationType,
) {
  const disabled = await db.query.notificationPreference.findFirst({
    where: and(
      eq(notificationPreference.userId, userId),
      eq(notificationPreference.type, type),
    ),
  });
  return !disabled;
}

export async function notifyFollow(actorId: string, recipientId: string) {
  if (actorId === recipientId) return;
  try {
    if (!(await isNotificationEnabled(recipientId, "FOLLOW"))) return;

    const existing = await db.query.notification.findFirst({
      where: and(
        eq(notification.recipientId, recipientId),
        eq(notification.type, "FOLLOW"),
        eq(notification.read, false),
      ),
    });

    if (existing) {
      if (existing.actorIds.includes(actorId)) return;
      await db
        .update(notification)
        .set({
          count: existing.count + 1,
          actorIds: [...existing.actorIds, actorId].slice(-MAX_ACTORS),
        })
        .where(eq(notification.id, existing.id));
      return;
    }

    await db.insert(notification).values({
      recipientId,
      type: "FOLLOW",
      actorIds: [actorId],
      count: 1,
    });
  } catch (err) {
    console.error("notifyFollow failed", err);
  }
}

export async function notifyActivityLike(
  actorId: string,
  recipientId: string,
  activityId: string,
) {
  if (actorId === recipientId) return;
  try {
    if (!(await isNotificationEnabled(recipientId, "ACTIVITY_LIKE"))) return;

    const existing = await db.query.notification.findFirst({
      where: and(
        eq(notification.recipientId, recipientId),
        eq(notification.type, "ACTIVITY_LIKE"),
        eq(notification.activityId, activityId),
        eq(notification.read, false),
      ),
    });

    if (existing) {
      const actorIds = existing.actorIds.includes(actorId)
        ? existing.actorIds
        : [...existing.actorIds, actorId].slice(-MAX_ACTORS);
      await db
        .update(notification)
        .set({ count: existing.count + 1, actorIds })
        .where(eq(notification.id, existing.id));
      return;
    }

    await db.insert(notification).values({
      recipientId,
      type: "ACTIVITY_LIKE",
      activityId,
      actorIds: [actorId],
      count: 1,
    });
  } catch (err) {
    console.error("notifyActivityLike failed", err);
  }
}

export async function notifyActivityUnlike(
  actorId: string,
  recipientId: string,
  activityId: string,
) {
  if (actorId === recipientId) return;
  try {
    const existing = await db.query.notification.findFirst({
      where: and(
        eq(notification.recipientId, recipientId),
        eq(notification.type, "ACTIVITY_LIKE"),
        eq(notification.activityId, activityId),
        eq(notification.read, false),
      ),
    });
    if (!existing) return;

    if (existing.count <= 1) {
      await db.delete(notification).where(eq(notification.id, existing.id));
      return;
    }

    await db
      .update(notification)
      .set({
        count: existing.count - 1,
        actorIds: existing.actorIds.filter((id) => id !== actorId),
      })
      .where(eq(notification.id, existing.id));
  } catch (err) {
    console.error("notifyActivityUnlike failed", err);
  }
}

export async function notifyActivityComment(
  actorId: string,
  recipientId: string,
  activityId: string,
) {
  if (actorId === recipientId) return;
  try {
    if (!(await isNotificationEnabled(recipientId, "ACTIVITY_COMMENT"))) return;

    await db.insert(notification).values({
      recipientId,
      type: "ACTIVITY_COMMENT",
      activityId,
      actorIds: [actorId],
      count: 1,
    });
  } catch (err) {
    console.error("notifyActivityComment failed", err);
  }
}

export async function notifyContestJoinRequest(
  actorId: string,
  recipientId: string,
  contestId: string,
) {
  if (actorId === recipientId) return;
  try {
    if (!(await isNotificationEnabled(recipientId, "CONTEST_JOIN_REQUEST")))
      return;

    await db.insert(notification).values({
      recipientId,
      type: "CONTEST_JOIN_REQUEST",
      contestId,
      actorIds: [actorId],
      count: 1,
    });
  } catch (err) {
    console.error("notifyContestJoinRequest failed", err);
  }
}

export async function notifyContestJoinApproved(
  actorId: string,
  recipientId: string,
  contestId: string,
) {
  if (actorId === recipientId) return;
  try {
    if (!(await isNotificationEnabled(recipientId, "CONTEST_JOIN_APPROVED")))
      return;

    await db.insert(notification).values({
      recipientId,
      type: "CONTEST_JOIN_APPROVED",
      contestId,
      actorIds: [actorId],
      count: 1,
    });
  } catch (err) {
    console.error("notifyContestJoinApproved failed", err);
  }
}

export async function notifyContestJoinRejected(
  actorId: string,
  recipientId: string,
  contestId: string,
) {
  if (actorId === recipientId) return;
  try {
    if (!(await isNotificationEnabled(recipientId, "CONTEST_JOIN_REJECTED")))
      return;

    await db.insert(notification).values({
      recipientId,
      type: "CONTEST_JOIN_REJECTED",
      contestId,
      actorIds: [actorId],
      count: 1,
    });
  } catch (err) {
    console.error("notifyContestJoinRejected failed", err);
  }
}

export async function notifyFollowedUserPublishedProblem(
  actorId: string,
  problemId: string,
) {
  try {
    const followers = await db.query.userFollow.findMany({
      where: eq(userFollow.followingId, actorId),
      columns: { followerId: true },
    });
    if (followers.length === 0) return;

    const followerIds = followers.map((f) => f.followerId);
    const disabled = await db.query.notificationPreference.findMany({
      where: and(
        inArray(notificationPreference.userId, followerIds),
        eq(notificationPreference.type, "FOLLOWED_USER_PUBLISHED_PROBLEM"),
      ),
      columns: { userId: true },
    });
    const disabledIds = new Set(disabled.map((d) => d.userId));
    const recipients = followerIds.filter((id) => !disabledIds.has(id));
    if (recipients.length === 0) return;

    await db.insert(notification).values(
      recipients.map((recipientId) => ({
        recipientId,
        type: "FOLLOWED_USER_PUBLISHED_PROBLEM" as const,
        problemId,
        actorIds: [actorId],
        count: 1,
      })),
    );
  } catch (err) {
    console.error("notifyFollowedUserPublishedProblem failed", err);
  }
}

export async function notifyExerciseUnlocked(
  userId: string,
  exerciseId: string,
) {
  try {
    if (!(await isNotificationEnabled(userId, "LESSON_UNLOCKED"))) return;

    const existing = await db.query.notification.findFirst({
      where: and(
        eq(notification.recipientId, userId),
        eq(notification.type, "LESSON_UNLOCKED"),
        eq(notification.exerciseId, exerciseId),
      ),
    });
    if (existing) return;

    await db.insert(notification).values({
      recipientId: userId,
      type: "LESSON_UNLOCKED",
      exerciseId,
      actorIds: [],
      count: 1,
    });
  } catch (err) {
    console.error("notifyExerciseUnlocked failed", err);
  }
}
