"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import { user } from "@/drizzle/schema";
import { fail, ok } from "@/lib/action-result";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  identityConflictFromPgError,
  isRaTaken,
  isUsernameTaken,
} from "@/lib/identity";
import { optionalRaSchema, usernameSchema } from "@/lib/username";
import type { UpdateProfileInput } from "@/hooks/user-update-profile";

const bioSchema = z.string().max(280).optional();
const locationSchema = z.string().max(120).optional();
const websiteSchema = z.union([z.url(), z.literal("")]).optional();

export async function updateProfile(input: UpdateProfileInput) {
  const currentUser = await getCurrentUser({});

  const parsedUsername = usernameSchema.safeParse(input.username);
  if (!parsedUsername.success) return fail("USERNAME_INVALID");

  const parsedRa = optionalRaSchema.safeParse(input.ra ?? "");
  if (!parsedRa.success) return fail("RA_INVALID");

  const parsedBio = bioSchema.safeParse(input.bio);
  if (!parsedBio.success) {
    throw new Error(parsedBio.error.issues[0]?.message ?? "Invalid bio");
  }

  const parsedLocation = locationSchema.safeParse(input.location);
  if (!parsedLocation.success) {
    throw new Error(
      parsedLocation.error.issues[0]?.message ?? "Invalid location",
    );
  }

  const parsedWebsite = websiteSchema.safeParse(input.website);
  if (!parsedWebsite.success) {
    throw new Error(
      parsedWebsite.error.issues[0]?.message ?? "Invalid website",
    );
  }

  if (await isUsernameTaken(parsedUsername.data, currentUser.id)) {
    return fail("USERNAME_TAKEN");
  }
  if (parsedRa.data && (await isRaTaken(parsedRa.data, currentUser.id))) {
    return fail("RA_TAKEN");
  }

  try {
    await db
      .update(user)
      .set({
        username: parsedUsername.data,
        ra: parsedRa.data,
        bio: parsedBio.data || null,
        location: parsedLocation.data || null,
        website: parsedWebsite.data || null,
      })
      .where(eq(user.id, currentUser.id));
  } catch (err) {
    const conflict = identityConflictFromPgError(err);
    if (conflict) return fail(conflict);
    throw err;
  }

  return ok(null);
}
