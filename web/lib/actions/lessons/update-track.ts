"use server";

import { eq } from "drizzle-orm";
import { db } from "@/drizzle/db";
import { lessonTrack } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";

async function assertOwnsTrack(trackId: string, userId: string) {
  const track = await db.query.lessonTrack.findFirst({
    where: eq(lessonTrack.id, trackId),
  });
  if (!track) throw new Error("Track not found");
  if (track.createdBy !== userId) throw new Error("Not the track owner");
  return track;
}

export async function updateTrack(input: {
  trackId: string;
  title?: string;
  description?: string;
  dueDate?: Date | null;
}) {
  const currentUser = await getCurrentUser({});
  await assertOwnsTrack(input.trackId, currentUser.id);

  const [updated] = await db
    .update(lessonTrack)
    .set({
      ...(input.title !== undefined ? { title: input.title } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.dueDate !== undefined ? { dueDate: input.dueDate } : {}),
    })
    .where(eq(lessonTrack.id, input.trackId))
    .returning();

  return updated;
}

export async function setTrackPublished(input: {
  trackId: string;
  isPublished: boolean;
}) {
  const currentUser = await getCurrentUser({});
  await assertOwnsTrack(input.trackId, currentUser.id);

  const [updated] = await db
    .update(lessonTrack)
    .set({ isPublished: input.isPublished })
    .where(eq(lessonTrack.id, input.trackId))
    .returning();

  return updated;
}

export async function deleteTrack(trackId: string) {
  const currentUser = await getCurrentUser({});
  await assertOwnsTrack(trackId, currentUser.id);

  await db.delete(lessonTrack).where(eq(lessonTrack.id, trackId));
}
