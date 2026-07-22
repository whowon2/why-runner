## Context

Profile avatar today is a plain `text("image")` URL column, edited via a raw URL text input in `form.tsx`. There is no cover image, no upload pipeline, no image processing dependency, and no crop UI anywhere in `web/`. This change introduces all of that from scratch: client-side crop, file upload transport, server-side processing, and storage.

Constraints:
- `web/` runs on Next.js 16 Server Actions as the only data-layer boundary (no separate REST/API routes conventionally used, per `web/CLAUDE.md`).
- No object storage (S3/Cloudinary) currently configured in `env.ts` — introducing one is a bigger infra decision than this UI feature warrants for a TCC-scoped app.
- `judge/` (separate repo/service) is unaffected — this is entirely a `web/` change.

## Goals / Non-Goals

**Goals:**
- Let a user upload an image file, crop/zoom it client-side, and persist the result as their avatar or cover image.
- Circular 1:1 crop for avatar; fixed wide-aspect crop for cover, matching the reference screenshots (grid overlay, zoom slider, Cancelar/Confirmar).
- Server-side re-encode/resize so stored files have predictable dimensions and format regardless of the source image.

**Non-Goals:**
- No third-party object storage (S3, Cloudinary, UploadThing) integration — local disk storage under `public/uploads/` is sufficient for this app's current deployment scale.
- No multi-image galleries, image history/versioning, or undo-after-confirm.
- No client-side-only crop without server processing (server must control final file size/format for consistency and to avoid trusting client-cropped pixels as final).

## Decisions

- **Crop library: `react-easy-crop`.** Matches the reference UI closely (draggable image, zoom slider, `getCroppedImg` canvas helper is a well-known recipe). Alternative considered: `react-image-crop` (rectangle-selection style, less suited to the pan/zoom-in-fixed-frame UX shown in the screenshots).
- **Crop math done twice, by design**: the crop dialog produces a cropped canvas client-side (fast preview + immediate visual confirmation matching Figma-like UX), but the canvas blob is what gets uploaded — the server does not need crop coordinates, only re-processes the already-cropped image. Server-side `sharp` step re-encodes to WebP/JPEG and enforces max dimensions (e.g. avatar 512×512, cover 1600×400) as a trust boundary — a client cannot upload an oversized or malformed file that persists as-is.
- **Storage: Vercel Blob** (`@vercel/blob`, `put`/`del`), path pattern `avatars/<userId>-<timestamp>.<ext>` / `covers/<userId>-<timestamp>.<ext>`. Rationale: app targets Vercel deployment where local disk writes don't persist across serverless invocations/redeploys; Blob gives durable public URLs with no extra infra to run. Requires `BLOB_READ_WRITE_TOKEN` env var.
- **Transport: single server action accepting `FormData`** (not JSON base64) — avoids inflating payload size by ~33% and is the idiomatic way to send binary blobs through a Next.js Server Action.
- **DB schema**: add `coverImage: text("cover_image")` to `user` table, same shape as existing `image` column (just a relative URL string, e.g. `/uploads/covers/abc-123.webp`).
- **Old file cleanup**: when a new avatar/cover is confirmed, delete the previous file from disk (best-effort, non-blocking) to avoid unbounded disk growth, using the previous DB value before overwrite.

## Risks / Trade-offs

- [Vercel Blob adds a paid/managed dependency and a new required env var] → Acceptable trade-off: avoids local-disk persistence issues on serverless deploys; token is documented in required env vars.
- [Client can send arbitrary "cropped" image files, not just genuine crops] → Server re-encodes via `sharp` and enforces max dimensions/file size/allowed mime types, so worst case is a wrong-looking-but-safe image, not an arbitrary file write (extension/type is server-determined, not taken from client filename).
- [Disk fills up over time from orphaned files if cleanup fails] → Best-effort delete of the previous file on each successful replace; acceptable risk given low expected upload volume.
- [`auth-schema.ts` (Better Auth generated file) may need manual sync with the new `coverImage` column] → Only touch it if Better Auth's user-table typing actually requires the field; otherwise leave it untouched since it's a generated file for auth internals, not general profile data.

## Migration Plan

1. Add `coverImage` column via `bun db:generate` + migration; nullable, no backfill needed (renders as gradient/empty state when null, same as today).
2. Add `react-easy-crop` and `sharp` to `web/package.json`.
3. Build shared crop dialog component, avatar upload flow, cover upload flow, server action(s), storage helper.
4. No rollback complexity beyond standard migration rollback — column is additive and nullable; feature is UI-additive (old URL-paste behavior is removed but the DB column itself is untouched).
