## 1. Eligibility

- [x] 1.1 In `web/lib/surveys/eligibility.ts`, replace the `lesson_author` `lesson.createdBy = userId` filter with "class owner OR `teacher` membership" (no admin fallback); update the rules doc comment
- [x] 1.2 Update the `lesson_author` wording in `web/lib/actions/surveys/get-survey-cta.ts` comments (teacher of the class, not "author")
- [x] 1.3 Confirm results/admin/CSV (`results.ts`, `aggregate.ts`, `csv.ts`, `app/api/surveys/export`) need no change for several responses per lesson

## 2. Checks and release

- [x] 2.1 `bun test lib`, typecheck, lint pass in `web/`
- [x] 2.2 Bump `web/package.json` patch version

## 3. Browser verification

- [x] 3.1 With local test accounts: owner teacher has a class with a published lesson (≥1 exercise, ≥1 student hand-in) and `coteacher@email.com` added as co-teacher
- [x] 3.2 As the co-teacher, the lesson page shows the `lesson_author` card and `/surveys` lists the lesson as pending; the form opens
- [x] 3.3 Independence of responses: unchanged per-user `findOwnResponse` check + `(user_id, form, lesson_id)` unique index; owner path untouched (not submitted in browser to keep local research data clean)

## 4. Ship

- [x] 4.1 Commit, push, open PR (no Co-authored-by trailer)
