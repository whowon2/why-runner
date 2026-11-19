## 1. Workflow

- [x] 1.1 `release-tags`: expose `judge_new` output (true when it created the `judge-vX.Y.Z` tag)
- [x] 1.2 Add `judge-deploy` job: main-push only, `needs: [judge-image, release-tags]`, gated on `judge_new`, job concurrency group `fly-deploy-why-runner-judge` without cancel-in-progress, `superfly/flyctl-actions/setup-flyctl@1.5`, `flyctl deploy -a why-runner-judge --image whowon/why-runner-judge:sha-${{ github.sha }}` from `judge/` with `FLY_API_TOKEN`
- [x] 1.3 Workflow-level concurrency: cancel in-progress runs only for non-`main` refs
- [x] 1.4 Update the `judge-image` comment (no longer "Fly still needs `fly deploy`")

## 2. Docs

- [x] 2.1 Root `CLAUDE.md` Versioning: auto-deploy on judge version bump, `FLY_API_TOKEN`, manual fallback, migration-ordering rule
- [x] 2.2 `judge/CLAUDE.md`: deploy section reflects auto-deploy + migration-ordering rule
- [x] 2.3 `judge/fly.toml` comments: CI deploys `:sha-<commit>`; `:latest` is for manual `fly deploy`

## 3. Validate

- [x] 3.1 Run actionlint (or a YAML parse fallback) on `.github/workflows/ci.yml`
- [x] 3.2 `openspec validate judge-auto-deploy`
