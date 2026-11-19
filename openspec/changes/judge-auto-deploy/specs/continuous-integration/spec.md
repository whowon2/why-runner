## ADDED Requirements

### Requirement: Judge auto-deploy to Fly
On a push to `main`, after the judge image has been pushed, CI SHALL deploy the judge to the Fly app `why-runner-judge` if and only if that run created the `judge-vX.Y.Z` tag for the version in `judge/Cargo.toml` (the same detection the `release-tags` job uses). The deploy SHALL use the immutable image `whowon/why-runner-judge:sha-<commit>` built by the same run, authenticate with the `FLY_API_TOKEN` repository secret, and SHALL NOT run on pull requests. At most one judge deploy SHALL run at a time, and a newer push to `main` SHALL NOT cancel a deploy in progress.

#### Scenario: Judge version bumped on main
- **WHEN** a push to `main` carries a `judge/Cargo.toml` version whose `judge-vX.Y.Z` tag does not exist yet and the judge checks pass
- **THEN** CI pushes the image, creates the tag, and runs `flyctl deploy -a why-runner-judge --image whowon/why-runner-judge:sha-<commit>`

#### Scenario: Web-only merge
- **WHEN** a push to `main` leaves the judge version unchanged (its `judge-vX.Y.Z` tag already exists)
- **THEN** the judge deploy job is skipped and the running judge is not restarted

#### Scenario: Pull request
- **WHEN** CI runs for a pull request
- **THEN** neither the judge image push nor the judge deploy runs

#### Scenario: Overlapping pushes
- **WHEN** a second push to `main` triggers a judge deploy while an earlier one is still running
- **THEN** the second deploy waits for the first to finish instead of running in parallel or cancelling it
