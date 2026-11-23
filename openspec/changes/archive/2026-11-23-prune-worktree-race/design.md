## Context

`prune-worktrees.sh` runs from the main checkout, usually inside zellij. Each worktree tab made by `new-worktree.sh` holds `claude` and `bun dev -p $DEV_PORT` (next dev, with child processes). `close-tab` is asynchronous: processes get SIGHUP and take a moment (next dev flushes `.next`, rewrites `next-env.d.ts`, `tsconfig.tsbuildinfo`) to exit.

## Goals / Non-Goals

**Goals:** no process writes into the path after removal; no leftover dirs or `prunable` entries; dry run stays side-effect free.

**Non-Goals:** macOS support; detecting processes that hold files open under the path but have their cwd elsewhere.

## Decisions

- **Detect by `/proc/*/cwd`, not `lsof +D`.** `lsof +D` walks the whole tree (huge with `node_modules`) and is slow; reading `/proc/<pid>/cwd` links is O(processes) and needs no extra tool. Match `cwd == path` or `cwd == path/*` so `../why-runner-foo` doesn't match `../why-runner-foo-bar`. The script skips its own PIDs.
- **Poll every 0.25 s, 15 s timeout** (`PRUNE_WAIT_SECS` env overrides). Tab close usually finishes in 1–3 s.
- **On timeout: warn, TERM, 2 s grace, KILL.** Dev tooling only; a stuck process blocking cleanup isn't worth preserving.
- **`git worktree remove --force` is not used first.** Plain `remove` keeps git's own safety; if it fails because files reappeared, fall through to `rm -rf` + `prune`. The uncommitted-changes check earlier already guards real work.
- **Wait even outside zellij** (e.g. user ran `bun dev` manually in another terminal): same wait/kill path applies, so cleanup is safe either way.

## Risks / Trade-offs

- [Killing a process the user still wanted, e.g. a shell `cd`'d into the worktree] → warn with PIDs and command names before killing; the branch is merged and clean, so nothing is lost.
- [`rm -rf` on a wrong path] → path comes from `git worktree list` and must start with the sibling prefix (already enforced), and is checked non-empty and not equal to `$root`.
