# Judge sandbox migration: Docker sibling-containers → isolate

**Status:** proposed
**Date:** 2026-09-15
**Scope:** `judge/` only. No changes to `web/`, DB schema, or job-claiming/retry logic.

## Context

Judge currently sandboxes untrusted submissions by spawning sibling Docker
containers on the host's daemon (`/var/run/docker.sock` mounted into the
judge-worker container; see `judge/src/runner.rs::run_in_docker`). This
requires the deployment host to expose a real, privileged Docker daemon to
the judge-worker container. Platforms like Railway (and most container-PaaS
providers) don't allow this — no privileged containers, no host docker
socket access — which rules them out as a judge deployment target under the
current architecture (see prior deploy investigation; VPS-with-Docker was
the only viable path).

This migration replaces per-language Docker containers with **isolate**
(https://github.com/ioi/isolate), a sandboxing tool purpose-built for
competitive-programming judges (used by IOI, judge0, CMS). isolate uses
Linux namespaces + cgroups to sandbox a single process without needing a
full container runtime, which — if the host's cgroup/namespace delegation
allows it — can run unprivileged, opening up PaaS targets like Railway.

**This is the central open risk of this whole migration**: it's unverified
whether isolate's setup (cgroup access, namespace creation) actually works
inside a Railway container. This must be validated *before* the rest of the
migration is built out — see Risks & Validation below.

## Goals

- Judge no longer depends on a host Docker daemon or `docker.sock` to run
  submissions.
- Equivalent or better isolation guarantees: no network, capped memory/CPU,
  wall-clock + CPU time limits, process-count cap (fork-bomb protection).
- Equivalent or better resource-usage reporting: current `peak_memory_kb` is
  a best-effort *sampled* approximation via polling `docker stats` every
  50ms; isolate reports actual peak RSS natively via its meta file — this
  migration removes the sampling hack, not just relocates it.
- All 6 existing languages (C, C++, Java, Python, Portugol, Rust) keep
  working with equivalent compile/run semantics (compile-error detection via
  stderr marker, TLE detection, etc.)
- `main.rs`, `db.rs`, `models.rs` are untouched — this is a `runner.rs`
  + `Dockerfile` + deploy-config change only.

## Non-goals

- Not changing the job-claim/retry/DLQ/leaderboard logic in `db.rs`.
- Not adding new languages as part of this migration.
- Not building a multi-tenant/horizontally-scaled isolate box-id allocator
  beyond what's needed for a single judge-worker process running test cases
  sequentially (matches current behavior — `process_job` already runs test
  cases one at a time per submission).
- Not picking a final deploy target (Railway vs VPS) — this migration is
  what *enables* the Railway option; the deploy decision is separate.

## Risks & validation (do this first)

Before investing in the full language rewrite, validate on an actual
Railway container (or the closest available approximation of Railway's
container runtime):

1. Can `isolate --init` successfully create a box (cgroup + namespace
   setup) as a non-root/unprivileged user in that environment?
2. If it needs elevated capabilities, which ones specifically, and does
   Railway's container runtime grant any of them (it grants none of
   `--privileged` today, but some individual capabilities like
   `CAP_SYS_ADMIN` might be a separate, more targeted ask worth checking
   with Railway support/docs)?
3. If isolate cannot work unprivileged there at all: this migration still
   has value (it removes the Docker dependency and simplifies deploy to
   *any* VPS/host with cgroups, including cheaper/simpler hosts than
   "must have Docker installed"), but the Railway-specific motivation
   fails and the deploy target stays VPS-only. Confirm this is still worth
   doing before implementation starts, given the added engineering cost —
   revisit with the user if the answer is no.

This validation is step 1 of the implementation plan, before any
per-language runner code is written.

## Design

### Image (`judge/Dockerfile`)

Single self-contained image, replacing the current
`debian` + `docker.io` base:

- Build `isolate` from source (`github.com/ioi/isolate`) — not packaged in
  Debian apt, has its own Makefile.
- Install every language toolchain directly in the image (no more pulling
  separate per-language Docker images at runtime):
  - `python3` (pinned version matching current `python:3.9-slim`, or
    updated — separate decision)
  - `gcc`/`g++` (matching current `gcc:13-bookworm`)
  - `rustc` (matching current `rust:1.80-slim`)
  - JDK 21 (matching current `eclipse-temurin:21-jdk`) — needed for both
    Java submissions and Portugol (which runs on the JVM)
  - `portugol-console.jar` + its ANTLR/audio lib dependencies (already
    vendored under `judge/portugol/lib/`)
- Drop `docker.io` package and the `/var/run/docker.sock` volume mount —
  no longer needed anywhere.
- Image will be significantly larger than today's judge-worker image
  (~2-3GB+ with all toolchains baked in) — this is an accepted tradeoff
  for removing the Docker dependency; the `portugol` Docker image build
  step in `compose.yml` also goes away since Portugol's runtime now lives
  in the main image.

### `runner.rs` rewrite

Replace `run_in_docker` with `run_in_isolate`. Per-language `run_<lang>`
functions keep their current shape (base64-encode source, build a
compile+run shell sequence) but delegate to the new function instead of
`run_in_docker`, passing a binary/interpreter path instead of a Docker
image name.

Per test-case execution (`run_in_isolate`):

1. **Allocate a box id.** isolate boxes are numbered 0–999. Since
   `process_job` already runs test cases strictly sequentially within one
   submission, and multiple judge-worker replicas each run as separate
   OS-level containers/hosts (separate cgroup hierarchies), a simple
   incrementing counter (wrapped mod 1000) scoped to the judge-worker
   process is sufficient — no cross-process coordination needed.
2. **Init**: `isolate --box-id=N --init` → returns the box's filesystem
   path. Write the base64-decoded source file into it (same
   encode-and-write pattern as today).
3. **Compile step** (for compiled languages): `isolate --box-id=N --run --
   /usr/bin/gcc ...` (or `rustc`, `javac`). Capture stderr; on non-zero
   exit, emit the existing `COMPILE_ERROR_MARKER` convention — this
   detection logic in `compile_and_run_command`-equivalent stays the same,
   just the invocation mechanism changes from a shell `&&`/exit-code chain
   inside a container to two separate `isolate --run` invocations in the
   same box (compile, then run), matching isolate's model of "one
   sandboxed process per `--run` call."
4. **Run step**: `isolate --box-id=N --time=<limit> --wall-time=<limit +
   small buffer> --mem=131072 --processes=64 --run -- <binary or
   interpreter>`.
   - `--mem=131072` = 128MB in KB, matching current `--memory 128m`.
   - No `--share-net` flag passed → no network access by default, matching
     current `--network none`.
   - `--processes=64` caps total processes/threads in the box — current
     Docker setup has no explicit process cap beyond cgroup memory; this
     is a *new*, additive safety property (fork-bomb protection), not a
     regression. Exact number is a starting point, tunable.
   - stdin is provided via `--stdin=<input_file>` (write `input_data` to a
     file in the box dir first) rather than the current live-piped stdin —
     simpler, and consistent with how source code is already
     written-then-run rather than streamed.
5. **Read results** from isolate's `--meta=<meta_file>` output: exit code,
   wall-time, time, `max-rss` (→ `peak_memory_kb`, no more polling/sampling
   — this is a real peak reported by the kernel via cgroups, not an
   approximation), and status flags (`TO` for timeout, `SG`/signal for
   crashes, etc.) — map these onto the existing `ExecutionResult` fields
   (`is_timeout`, `exit_code`, etc.).
6. **Cleanup**: `isolate --box-id=N --cleanup`.

`sample_peak_memory` and `parse_mem_to_kb` (the `docker stats` polling
helpers) are deleted entirely — meta-file parsing replaces them with a
simple key=value line parser.

### Deploy config changes

- `judge/Dockerfile`: as above.
- `judge/compose.yml` / `compose.prod.yml`: drop the `/var/run/docker.sock`
  volume mount on `judge-worker`; drop the `portugol` build service (jar
  now baked into the main image at build time instead of being a separate
  runtime image).
- `judge/deploy/README.md`: drop the Docker-daemon-on-host requirement;
  once validated, add a Railway-specific deploy path alongside the
  existing VPS one.

### Unaffected

`main.rs` (job loop), `db.rs` (all SQL, claim/retry/DLQ/leaderboard logic),
`models.rs` (row types, `Language`/`SubmissionStatus` enums) — none of this
touches sandboxing and none of it changes.

## Testing

No existing test suite in this crate (`judge/CLAUDE.md` notes this). For
this migration specifically, manual verification per language is the bar,
matching how the current Docker-based runner was presumably validated:

- One passing and one failing (wrong-output) submission per language.
- One compile-error submission per compiled language (C, C++, Java, Rust).
- One TLE submission (infinite loop) to confirm `--wall-time` kill + status
  mapping.
- One memory-bomb submission to confirm `--mem` cap + OOM status mapping.
- One fork-bomb submission to confirm `--processes` cap holds.
- Confirm Portugol's space/newline stdin normalization still behaves
  identically (unaffected code path, but exercised through the new stdin
  file-write path instead of a live pipe).

## Open questions for implementation planning

- Exact isolate version/commit to build from source, and whether to vendor
  it or build in a Docker multi-stage step (recommend multi-stage: `FROM
  <builder> AS isolate-builder` → copy binary into final image, same
  pattern already used for the Rust judge binary itself).
- `--wall-time` buffer over `--time` (how much slack beyond the CPU time
  limit before wall-clock kill — current Docker version relies solely on
  external `tokio::time::timeout` wall-clock enforcement, so this is a new
  parameter to tune, not a direct port of an existing value).
