## 1. Verify data path

- [x] 1.1 Confirm `getUserContestSubmissions` returns `code` and `language` and filters by `currentUser.id` only (no client-supplied user id); no change expected

## 2. i18n

- [x] 2.1 Add `codeLabel` ("Your code" / "Seu código") under `ContestsPage.Tabs.Problem.Submissions` in `web/messages/en.json` and `web/messages/br.json`

## 3. Submission list UI

- [x] 3.1 In `submission-list.tsx`, show `submission.language` (when non-null) in the `AccordionTrigger` row between time and status, muted styling
- [x] 3.2 Add a code section at the top of `AccordionContent`: label + `CopyButton` (`components/copy-button.tsx`) header, `<pre>` with monospace, `whitespace-pre`, horizontal + vertical scroll, `max-h-80`, `bg-muted/50`, `text-foreground` so status colors don't tint it
- [x] 3.3 Move the `submission.output &&` guard so it wraps only `SubmissionDetails`; code renders for every status including `PENDING`/`RUNNING`

## 4. Verify

- [x] 4.1 Run `bun lint` in `web/`
- [x] 4.2 Manually check in a running contest: submit two different attempts, expand each, confirm correct code per attempt, language in row, copy works with toast, pending attempt shows code, Python indentation preserved

## 5. Auto-save on blur

- [x] 5.1 In `upload.tsx`, register Monaco `onDidBlurEditorText` on mount to save code to localStorage (same `code-<problemId>-<language>` key), skipping no-language, empty, or unchanged code; wrap storage access in try/catch
- [x] 5.2 Show saved state: save button flips to green check for ~2s, and a `savedLocallyAt` line ("Saved in this browser at {time}") under the toolbar; reset on problem/language change
- [x] 5.3 Add `savedLocallyAt` to `en.json` and `br.json`
- [x] 5.4 Manually check: edit, click outside → check icon + saved line; reload, pick same language → saved code loads (auto-load per 6.1)

## 6. Per-problem, per-language slots

- [x] 6.1 On problem/language change, save editor into the previous slot and load the new slot's saved code (empty if none); keep typed-before-language code and offer the saved version via the existing prompt
- [x] 6.2 Save current slot on `pagehide`
- [x] 6.3 Fix editor `onChange` dropping empty strings (`setCode(c ?? "")`) so a cleared editor doesn't keep stale text
- [x] 6.4 Manually check: python → cpp → python keeps both; problem A → B → A keeps each; reload restores current slot
