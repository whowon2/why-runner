## Why

CI pushes the judge image to Docker Hub on every push to `main`, but `fly deploy -a why-runner-judge` is manual, so production drifts. On 2026-11-10 Fly still ran judge v1.0.1 (released 2026-10-30) while the repo was at 1.1.1, and custom runs (`code_run`, #89) were broken on prod because the old judge never claimed them.

## What Changes

- New `judge-deploy` job in `.github/workflows/ci.yml`: runs on push to `main` only, after `judge-image` and `release-tags`, and only when this push introduced a new judge version (the same "`judge-vX.Y.Z` tag does not exist yet" check `release-tags` uses). Web-only merges and judge merges without a version bump do not restart the judge.
- The deploy uses `superfly/flyctl-actions/setup-flyctl` and runs `flyctl deploy -a why-runner-judge --image whowon/why-runner-judge:sha-<commit>` (immutable tag, not `:latest`), authenticated with a new `FLY_API_TOKEN` repository secret (a Fly deploy token scoped to the app).
- `release-tags` exposes whether it created the judge tag as a job output, so detection lives in one place.
- A job-level concurrency group (`fly-deploy-why-runner-judge`, no cancel-in-progress) so two deploys never overlap; the workflow-level group stops cancelling in-progress runs on `main`, so a newer push cannot kill a deploy mid-rollout.
- Documented rule: schema changes the judge needs ship (and migrate via the Vercel build) in an earlier PR than the judge change that uses them, because judge ≥1.1.1 fails unloadable rows straight to `ERROR` (#95).
- Docs: root `CLAUDE.md` Versioning section, `judge/CLAUDE.md`, and `judge/fly.toml` comments no longer say deploy is manual; they describe the auto-deploy, the secret, and the manual fallback.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `continuous-integration`: adds a requirement that CI deploys the judge to Fly when `main` carries a new judge version, without overlapping deploys.

## Impact

- `.github/workflows/ci.yml` (new job, `release-tags` output, workflow concurrency).
- `CLAUDE.md`, `judge/CLAUDE.md`, `judge/fly.toml` (comments/docs only).
- New GitHub secret `FLY_API_TOKEN` (one-time setup by the maintainer). Until it exists the `judge-deploy` job fails on the first judge version bump; nothing else is affected.
- Production judge restarts automatically after a judge version bump lands on `main`.
