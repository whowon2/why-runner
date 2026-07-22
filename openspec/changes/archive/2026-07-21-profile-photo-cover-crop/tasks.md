## 1. Dependencies & Schema

- [x] 1.1 Add `react-easy-crop` and `sharp` to `web/package.json`
- [x] 1.2 Add `coverImage: text("cover_image")` column to `user` table in `web/drizzle/schemas/users.ts`
- [x] 1.3 Generate migration (`bun db:generate`) and apply it (`bun db:push`/`bun db:migrate`)
- [x] 1.4 Sync `web/drizzle/schemas/auth-schema.ts` with the new column if Better Auth typing requires it (no such generated file exists in this repo; nothing to sync)

## 2. Storage & Server Action

- [x] 2.1 Add storage helper using `@vercel/blob` (`put`/`del`): uploads a processed image buffer to `avatars/<userId>-<timestamp>.<ext>` or `covers/<userId>-<timestamp>.<ext>`, returns the public URL, and deletes a given previous blob URL (best-effort)
- [x] 2.2 Add server action(s) that accept `FormData` (image blob + kind: avatar/cover), validate mime type and max file size, reject invalid input
- [x] 2.3 Process accepted images with `sharp`: resize/re-encode avatar to fixed square dimensions, cover to fixed wide-aspect dimensions, output WebP/JPEG
- [x] 2.4 Persist resulting URL to `user.image` (avatar) or `user.coverImage` (cover) via Drizzle, deleting the previous file after successful DB update
- [x] 2.5 Wire the new action(s) into `hooks/user-update-profile.tsx` or add a dedicated hook for image upload

## 3. Crop Dialog Component

- [x] 3.1 Build shared crop dialog component using `components/ui/dialog.tsx` primitives + `react-easy-crop`, parameterized by aspect ratio and crop shape (round for avatar, rect for cover)
- [x] 3.2 Implement zoom slider, grid overlay, Cancelar/Confirmar footer actions matching reference UI
- [x] 3.3 Implement `getCroppedImg` canvas helper to produce a cropped image blob from the source file + crop area on Confirmar
- [x] 3.4 On Confirmar, submit the cropped blob via the upload server action/hook; on Cancelar, discard local state and close without uploading

## 4. Profile Settings UI

- [x] 4.1 Replace the avatar URL text input in `web/app/[locale]/user/_components/form.tsx` with a file-picker trigger that opens the avatar crop dialog (avatar editing moved to a camera-icon trigger on the avatar itself in `profile.tsx`; the URL field was removed from the form)
- [x] 4.2 Add a cover upload trigger ("Alterar capa" button, camera icon overlay) that opens the cover crop dialog
- [x] 4.3 Update `web/app/[locale]/user/_components/profile.tsx` to render `data.coverImage` as the banner image when set, falling back to the existing gradient placeholder when null
- [x] 4.4 Add loading/error state handling for in-flight uploads (disable triggers, surface upload errors)

## 5. i18n

- [x] 5.1 Add new strings to `web/messages/br.json` and `web/messages/en.json`: "Ajustar avatar", "Ajustar capa", "Alterar capa", "Confirmar", "Cancelar", upload error messages (locale files are `en.json`/`br.json` in this repo, not `pt.json`)

## 6. Verification

- [ ] 6.1 Manually test avatar upload/crop/confirm/cancel flow in the browser
- [ ] 6.2 Manually test cover upload/crop/confirm/cancel flow in the browser (found and fixed a `next.config.ts` `images.remotePatterns` gap for the Vercel Blob hostname; not yet re-verified after the fix)
- [ ] 6.3 Verify old avatar/cover files are deleted from `public/uploads/` after replacement (storage is Vercel Blob, not local disk; needs verification that `del()` actually removes the old blob)
- [ ] 6.4 Verify oversized/invalid file uploads are rejected with a visible error
- [x] 6.5 Run `bun lint` and `tsc --noEmit` — no errors in any new/changed files (repo has pre-existing unrelated lint errors in untouched files)
