import { del, put } from "@vercel/blob";

export type ProfileImageKind = "avatars" | "covers";

export async function saveUploadedImage(
  buffer: Buffer,
  kind: ProfileImageKind,
  userId: string,
): Promise<string> {
  const pathname = `${kind}/${userId}-${Date.now()}.webp`;
  const blob = await put(pathname, buffer, {
    access: "public",
    contentType: "image/webp",
  });
  return blob.url;
}

export async function deleteUploadedImage(
  url: string | null | undefined,
): Promise<void> {
  if (!url) return;
  try {
    await del(url);
  } catch {
    // best-effort cleanup
  }
}
