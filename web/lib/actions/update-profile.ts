"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/drizzle/db";
import { user } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import { usernameSchema } from "@/lib/username";
import type { UpdateProfileInput } from "@/hooks/user-update-profile";

const bioSchema = z.string().max(280).optional();
const locationSchema = z.string().max(120).optional();
const websiteSchema = z.union([z.url(), z.literal("")]).optional();

export async function updateProfile(input: UpdateProfileInput) {
  const currentUser = await getCurrentUser({});

  const parsedUsername = usernameSchema.safeParse(input.username);
  if (!parsedUsername.success) {
    throw new Error(
      parsedUsername.error.issues[0]?.message ?? "Invalid username",
    );
  }

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

  const existing = await db.query.user.findFirst({
    where: (u, { eq: eqOp, and, ne }) =>
      and(eqOp(u.username, parsedUsername.data), ne(u.id, currentUser.id)),
  });
  if (existing) {
    throw new Error("Username is already taken");
  }

  await db
    .update(user)
    .set({
      username: parsedUsername.data,
      bio: parsedBio.data || null,
      location: parsedLocation.data || null,
      website: parsedWebsite.data || null,
    })
    .where(eq(user.id, currentUser.id));
}
