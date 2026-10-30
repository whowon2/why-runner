# Post-evaluation changes

Changes made after the first classroom test (IFMG, 2026-10-29), from the
feedback collected during that session. Source material for the TCC II deck
and the thesis ("classroom feedback → fixes"). Survey analysis is separate;
see `survey-review.md` once written.

| # | Feedback from the classroom | Change | PR |
|---|---|---|---|
| 1 | Interface opened in English for Brazilian students | `br` is the default locale; any `pt*` `Accept-Language` resolves to `br` | #81 |
| 2 | AI answers (hints, explanations) slow because Gemini failed often | Claude Haiku first in the provider chain, Gemini as fallback | #81 |
| 3 | Survey scale only labelled at 1 and 5 | Every Likert point 1–5 labelled | #81 |
| 4 | Google Translate extension crashed the starter code when switching language | Code surfaces, editors and the language selector marked `translate="no"` / `notranslate` | #81 |
| 5 | "Show expected outputs" switch took seconds to apply | Optimistic update and narrow cache invalidation for lesson settings (was ~9 serialized server actions × ~500 ms) | #81 |
| 6 | Asked for a bigger editor and adjustable font | Shared `CodeEditor`: fullscreen toggle and persisted font size | #81 |
| 7 | Adding an exercise to a lesson showed only titles, first 50 own problems | Searchable `ProblemPicker` shared with contests (code, title, author, difficulty) | #81 |
| 8 | Onboarding step was an extra hurdle | Onboarding removed; username chosen on the signup form | #82 |
| 9 | Usernames rejected uppercase | `A-Z` allowed, case kept, uniqueness case-insensitive (`lower(username)` index) | #82 |
| 10 | Students typed their RA into the username field | New optional `user.ra` (7 digits, text), shown to class teachers and in exports; migration `0049` backfilled RA from 7-digit usernames | #82 |
| 11 | Failing submission on an exercise showed no test details | Exercise submissions render the failing-test report (input / expected / actual, or "hidden") | #83 |
| 12 | Exercise page showed every test input, ignoring hidden tests | Per-test `visible` flag (new tests hidden by default); lesson mode `problem_default` / `show_all` / `hide_all` replaces the switch; migration `0050` | #83 |
| 13 | Only one teacher per class | Co-teachers (`classroom_membership.role`): all owner powers except deleting the class and managing co-teachers; migration `0051` | #84 |
| 14 | No account that could see every class, contest and the survey results | `user.role = admin`, `/admin` pages, replaces the `SURVEY_ADMIN_EMAILS` gate (`bun db:seed:admins`) | #84 |

Out of scope by decision: feature flags.

Specs for each change are archived under `openspec/changes/archive/`
(`2026-10-29-classroom-feedback-quick`, `2026-10-29-signup-ra`,
`2026-10-30-test-visibility`, `2026-10-30-roles-coteachers`).
