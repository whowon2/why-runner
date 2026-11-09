# Post-evaluation changes

Changes made after the first classroom test (IFMG, 2026-10-29), from the
feedback collected during that session. Source material for the TCC II deck
and the thesis ("classroom feedback → fixes"). Survey analysis is separate;
see `survey-review.md`.

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
| 15 | Survey F2: AI explanation could not be scrolled; wanted it beside the code | AI help dialog keeps title/buttons fixed and scrolls the hints; every dialog capped to the viewport; on wide screens the help can be docked as a side panel next to the editor | #88 |
| 16 | Survey F3: changing the site language erased the code | Editor drafts saved in `localStorage` per user, exercise/problem/contest problem and language, plus the last language; restored on mount, cleared on Accepted and on reset. Contest slots moved to per-user keys (shared lab computers) | #88 |
| 17 | Survey F4: auto-closing brackets felt intrusive | Toggle next to the font size, persisted for every editor, default on | #88 |
| 18 | Survey F5: verdict far from the editor | Latest submission's verdict and pass count (`3/5`) in the editor toolbar next to submit; opens the full report (also in fullscreen). Lists refresh every 2 s while judging | #88 |
| 19 | Survey F7: pasting code from another editor | Reproduced: Monaco keeps pasted no-break spaces (Python: `invalid non-printable character U+00A0`) and opens a native English `confirm()` for U+2028 line separators. Submit actions now normalize invisible spaces, zero-width characters, line endings and Python leading tabs; the editor drops U+2028/U+2029 silently | #88 |
| 20 | Survey F8 (from production data): 31 failures on one problem printed `input("Digite…")` prompts | Failure view shows a hint when the output has the expected lines plus extra text: "print only what the output asks for". The practice Results dialog now shows the student's own output too | #88 |
| 21 | Survey F6: no way to run the program before submitting | "Run" button and stdin box on every code editor (problem, contest, lesson code/blocks): one ungraded run in the judge sandbox showing stdout, stderr, exit code, time and memory. Separate `code_run` table and `new_run` channel (migration `0052`), 10 runs/min, contest toggle `allow_runs`, gated by `CUSTOM_RUN_ENABLED` | #89 |

Out of scope by decision: feature flags.

Specs for each change are archived under `openspec/changes/archive/`
(`2026-10-29-classroom-feedback-quick`, `2026-10-29-signup-ra`,
`2026-10-30-test-visibility`, `2026-10-30-roles-coteachers`) and, for
15–20, `survey-feedback-fixes` (web 1.1.0, #88), and for 21,
`2026-10-30-custom-run` (judge 1.1.0, web 1.2.0, #89).

Not changed by decision: survey F1 (switching the pre-0048 problems from
`exact` to `tokens`). It stays a known limitation / future work in the thesis.
