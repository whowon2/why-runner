## Why

`scripts/prune-worktrees.sh` closes a worktree's zellij tab and runs `git worktree remove` immediately. `zellij action close-tab` returns before the tab's processes (claude, `bun dev`/next dev) have exited, so the dying dev server writes `web/.next`, `web/next-env.d.ts`, `web/package.json`, `tsconfig.tsbuildinfo`, etc. back into the folder after git removed it. That leaves half-empty sibling dirs (~1 GB each, mostly `node_modules`) and sometimes `prunable` worktree registrations.

## What Changes

- After closing the tab, wait (bounded, ~15 s) until no process has its cwd under the worktree path.
- On timeout, warn and kill the remaining processes (TERM, then KILL).
- Then `git worktree remove`, `rm -rf` whatever is left of the path, and `git worktree prune`.
- `-n` dry run prints the planned actions (tab close, wait, removal) without doing any of them.

## Capabilities

### New Capabilities
- `worktree-cleanup`: how `scripts/prune-worktrees.sh` tears down a merged worktree so nothing is written back after removal.

### Modified Capabilities

## Impact

- `scripts/prune-worktrees.sh` only. Dev tooling; no app, DB or judge changes. Uses `/proc/*/cwd` (Linux); no new dependencies.
