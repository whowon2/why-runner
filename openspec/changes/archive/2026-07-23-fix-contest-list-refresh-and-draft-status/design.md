## Context

Contest status lives in two places today: the DB column `contest.status` (`draft` | `published`, set only by create/publish) and a derived, date-only helper `getContestStatus()` used purely for UI badges (`draft`/`upcoming`/`active`/`past`). The derived helper never consults the real `status` column, so once a draft gets a start/end date it visually "leaves" draft even though the DB row is untouched. Separately, `useDeleteContest` never invalidates the `["contests"]` React Query cache, so the list page shows stale data after a redirect. Both are small, localized fixes; no schema or architecture change needed.

## Goals / Non-Goals

**Goals:**
- Make displayed contest status always reflect real DB `status` for drafts (draft stays draft until published).
- Make the contests list refresh immediately after delete.
- Keep publish as the single, explicit transition out of `draft`, still gated on a strictly-future start date (already enforced server-side).

**Non-Goals:**
- No DB schema change — `status` enum already models draft/published correctly.
- Not reworking the `upcoming`/`active`/`past` computation for published contests, only gating it behind `status === "published"`.
- Not changing the publish button's placement (tabs bar) — out of scope for these two bugs.

## Decisions

- **Gate `getContestStatus` on real status, not just dates.** Change signature to `getContestStatus(status, start, end, now)`: if `status === "draft"`, return `"draft"` immediately; otherwise fall through to existing date logic. Chosen over adding a brand-new "isDraft" flag at each call site because it keeps one source of truth for the badge computation and forces every caller to pass the real status, preventing this class of bug from resurfacing at a new call site.
- **Invalidate `["contests"]` in `useDeleteContest`'s `onSuccess`**, mirroring the pattern from commit `29fd83e` (`useQueryClient().invalidateQueries({ queryKey: ["contests"] })`), rather than invalidating in the component's `onSuccess` callback — keeping invalidation inside the mutation hook itself (per the new `query-cache-invalidation` skill/convention) guarantees it fires for every caller, not just the Danger Zone UI.
- **Add server-side `endDate > startDate` validation to `updateContest`.** Currently only client-side zod enforces this; since this change touches the draft-editing path, add a minimal guard so a malformed direct call can't persist an invalid date range. Reuse the same comparison already present in `publishContest`.
- **No change to `publishContest`'s future-date check** — it already rejects `startDate <= now`. Verify `PublishContest`'s client-side validation message is clear when this happens (today/past date), as a small UX polish, not a new mechanism.

## Risks / Trade-offs

- [Risk] Changing `getContestStatus`'s signature touches multiple call sites (`card.tsx`, `description.tsx`, `getStatusText`) → Mitigation: TypeScript will fail to compile any missed call site since the new param is required; fix is mechanical.
- [Risk] Invalidating `["contests"]` broadly (partial key match) could cause extra refetches on unrelated contest list variants → Mitigation: acceptable, matches the existing established pattern from commit `29fd83e`, and list queries are cheap.

## Migration Plan

No data migration. Deploy as a normal code change; no feature flag needed since both are pure bug fixes with no behavior users currently rely on.

## Open Questions

None.
