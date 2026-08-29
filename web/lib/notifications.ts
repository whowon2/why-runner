import { and, eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import {
  notification,
  notificationPreference,
  type NotificationType,
} from "@/drizzle/schema";

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
