## Context

`ci.yml` on push to `main`: `judge` (fmt/clippy/test) → `judge-image` (pushes `:latest`, `:sha-<commit>`, `:v<version>`); `web` + `judge` → `release-tags` (creates `judge-vX.Y.Z` / `web-vX.Y.Z` if missing). Fly app `why-runner-judge` (`judge/fly.toml`, single `shared-cpu-1x` machine, `[build] image = whowon/why-runner-judge:latest`) is only updated by a manual `fly deploy`. The web deploys on Vercel and runs Drizzle migrations during its production build (`web/scripts/migrate-if-production.mjs`), in parallel with GitHub Actions. Since 1.1.1 (#95) the judge fails a claimed row it cannot load (unknown enum label/column) to `ERROR` instead of leaving it `RUNNING`.

## Goals / Non-Goals

**Goals:**
- Prod judge matches the latest released judge version without a human step.
- No judge restart for web-only merges or judge merges without a version bump.
- Deploy exactly the image this commit built; never two deploys at once.

**Non-Goals:**
- Waiting for the Vercel deploy/migrations before deploying the judge (documented as a merge-order rule instead).
- Automatic rollback, health checks beyond what `flyctl deploy` does, preview/staging judges.
- Changing how web wakes a stopped judge (`notifyJudge()` Machines API start).

## Decisions

1. **Gate on `release-tags` output, not a separate check.** `release-tags` already decides "is `judge-vX.Y.Z` new?" and creates the tag. A separate check in another job would race with it (whichever runs first creates the tag, the other sees it exists). So `release-tags` sets `judge_new=true` when it creates the judge tag, and `judge-deploy` has `needs: [judge-image, release-tags]` and `if: needs.release-tags.outputs.judge_new == 'true'`. Self-healing: if the bump commit's run is cancelled or never tags, the next `main` run sees the tag missing and both tags and deploys.
   - Alternative: diff `judge/Cargo.toml` against `HEAD~1` — wrong with multi-commit pushes and cancelled runs.
   - Trade-off: `judge-deploy` also waits on the `web` job (via `release-tags`). Acceptable; a red `main` should not deploy anyway.
2. **Immutable image tag.** `--image whowon/why-runner-judge:sha-${{ github.sha }}` — the exact image `judge-image` pushed in this run. `:latest` could be overwritten by a later run before Fly pulls it. `fly.toml`'s `[build] image = :latest` stays for manual `fly deploy`.
3. **Token = Fly deploy token** (`fly tokens create deploy -a why-runner-judge`), scoped to this app, stored as `FLY_API_TOKEN` secret, passed as env to the step only.
4. **Concurrency.** Job-level `concurrency: { group: fly-deploy-why-runner-judge, cancel-in-progress: false }`. The workflow-level `ci-${{ github.ref }}` group currently has `cancel-in-progress: true`, which would let a new push to `main` kill a deploy mid-rollout; change it to cancel only for non-`main` refs. On `main` newer runs then queue (GitHub keeps one pending run per group, replacing older pending ones — fine, given Decision 1's self-healing gate).
5. **Pin action** `superfly/flyctl-actions/setup-flyctl@1.5` (tagged release) rather than `@master`.
6. **Migration ordering is a documented rule.** The Vercel build (migrations) and `judge-deploy` run concurrently after a merge, with no ordering. A judge that needs a new column/enum label must not reach prod before the migration, and the web must not write new enum labels before the judge knows them (the latter is the existing "unloadable → ERROR" path, which is safe but user-visible). Rule: schema changes the judge needs ship in an earlier PR (merged, Vercel production deploy finished) than the judge change that depends on them. Enforcing it in CI (polling the Vercel deployment) is out of scope.

## Risks / Trade-offs

- [`FLY_API_TOKEN` missing] → `judge-deploy` fails red on the first version bump; fix by setting the secret and re-running failed jobs (re-run keeps `release-tags` outputs).
- [Deploy fails after tag was created] → re-run failed jobs; or manual `fly deploy -a why-runner-judge --image whowon/why-runner-judge:sha-<commit>` from `judge/`.
- [Judge restart interrupts an in-flight job] → existing behaviour: stale `RUNNING` rows are reclaimed after `STALE_RUNNING_THRESHOLD`, same as a manual deploy.
- [Machine stopped by idle auto-stop] → `flyctl deploy` updates stopped machines' config; it is started later by web's `notifyJudge()` as today.
- [Merge-order rule ignored] → rows fail to `ERROR` with a reason naming the judge version (judge ≥1.1.1), recoverable by resubmitting after both are deployed.

## Migration Plan

1. One-time: `fly tokens create deploy -a why-runner-judge` → `gh secret set FLY_API_TOKEN`.
2. Merge. The next judge version bump on `main` deploys automatically; verify with `fly logs -a why-runner-judge` (`WhyRunner judge vX.Y.Z (<sha>)`).
3. Rollback: `fly deploy -a why-runner-judge --image whowon/why-runner-judge:sha-<older commit>` (or `:v<older version>`); to disable, remove the job or the secret.

## Open Questions

- None blocking. A `workflow_dispatch` "force deploy" input could be added later if manual re-deploys from CI become common.
