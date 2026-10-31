"use server";

import { db } from "@/drizzle/db";
import { userPreference } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { preferencesPatchSchema } from "@/lib/preferences";

/** Saves the given settings for the caller; omitted fields are untouched. */
export async function updateUserPreferences(input: unknown) {
  const currentUser = await getCurrentUser({});
  const patch = pickPatch(input);
  if (Object.keys(patch).length === 0) return;

  await db
    .insert(userPreference)
    .values({ userId: currentUser.id, ...patch })
    .onConflictDoUpdate({
      target: userPreference.userId,
      set: { ...patch, updatedAt: new Date() },
    });
}

/**
 * Creates the caller's row from their browser's settings unless one exists
 * (another device may have created it first). Returns the stored row.
 */
export async function seedUserPreferences(input: unknown) {
  const currentUser = await getCurrentUser({});
  const patch = pickPatch(input);

  await db
    .insert(userPreference)
    .values({ userId: currentUser.id, ...patch })
    .onConflictDoNothing();

  return (
    (await db.query.userPreference.findFirst({
      where: (row, { eq }) => eq(row.userId, currentUser.id),
    })) ?? null
  );
}

// Only the schema's listed fields, copied one by one.
function pickPatch(input: unknown) {
  const parsed = preferencesPatchSchema.parse(input);
  return {
    ...(parsed.colorMode !== undefined && { colorMode: parsed.colorMode }),
    ...(parsed.theme !== undefined && { theme: parsed.theme }),
    ...(parsed.editorFontSize !== undefined && {
      editorFontSize: parsed.editorFontSize,
    }),
    ...(parsed.editorAutoClose !== undefined && {
      editorAutoClose: parsed.editorAutoClose,
    }),
    ...(parsed.editorVim !== undefined && { editorVim: parsed.editorVim }),
    ...(parsed.editorTabSize !== undefined && {
      editorTabSize: parsed.editorTabSize,
    }),
    ...(parsed.editorWordWrap !== undefined && {
      editorWordWrap: parsed.editorWordWrap,
    }),
    ...(parsed.editorLineNumbers !== undefined && {
      editorLineNumbers: parsed.editorLineNumbers,
    }),
    ...(parsed.editorMinimap !== undefined && {
      editorMinimap: parsed.editorMinimap,
    }),
  };
}
