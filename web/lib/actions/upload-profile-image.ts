"use server";

import { eq } from "drizzle-orm";
import sharp from "sharp";
import { db } from "@/drizzle/db";
import { user } from "@/drizzle/schema";
import { getCurrentUser } from "@/lib/auth/get-current-user";
import {
  deleteUploadedImage,
  saveUploadedImage,
} from "@/lib/upload/image-storage";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const DIMENSIONS = {
  avatar: { width: 512, height: 512 },
  cover: { width: 1600, height: 900 },
} as const;

export type ProfileImageKind = keyof typeof DIMENSIONS;

export async function uploadProfileImage(formData: FormData) {
  const currentUser = await getCurrentUser({});

  const file = formData.get("file");
  const kind = formData.get("kind");
  const dimRaw = formData.get("dim");

  if (!(file instanceof File)) {
    throw new Error("No file provided");
  }
  if (kind !== "avatar" && kind !== "cover") {
    throw new Error("Invalid image kind");
  }
  let dim: number | undefined;
  if (kind === "cover" && typeof dimRaw === "string" && dimRaw !== "") {
    dim = Math.min(100, Math.max(0, Number(dimRaw)));
    if (Number.isNaN(dim)) {
      throw new Error("Invalid dim value");
    }
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Unsupported file type");
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File too large");
  }

  const arrayBuffer = await file.arrayBuffer();
  const { width, height } = DIMENSIONS[kind];
  const processed = await sharp(Buffer.from(arrayBuffer))
    .resize(width, height, { fit: "cover" })
    .webp({ quality: 85 })
    .toBuffer();

  const storageKind = kind === "avatar" ? "avatars" : "covers";
  const url = await saveUploadedImage(processed, storageKind, currentUser.id);

  const previousUser = await db.query.user.findFirst({
    where: (u, { eq: eqOp }) => eqOp(u.id, currentUser.id),
  });

  await db
    .update(user)
    .set(
      kind === "avatar"
        ? { image: url }
        : { coverImage: url, ...(dim !== undefined ? { coverDim: dim } : {}) },
    )
    .where(eq(user.id, currentUser.id));

  await deleteUploadedImage(
    kind === "avatar" ? previousUser?.image : previousUser?.coverImage,
  );

  return { url };
}
