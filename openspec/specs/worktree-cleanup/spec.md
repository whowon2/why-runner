# worktree-cleanup Specification

## Purpose
`scripts/prune-worktrees.sh` tears down merged sibling worktrees safely: it waits for (or kills) processes still running in the folder before removing it, leaves no directory or stale registration behind, and its dry run prints the plan without side effects.
## Requirements
### Requirement: Worktree processes exit before removal
`scripts/prune-worktrees.sh` SHALL, after closing a merged worktree's zellij tab, wait up to a bounded timeout (15 s by default) until no process has its working directory at or under the worktree path, before removing the worktree.

#### Scenario: Dev server exits after tab close
- **WHEN** the worktree's tab running `claude` and `bun dev` is closed and both exit within the timeout
- **THEN** the script removes the worktree only after no process has its cwd under the path, and no files reappear in the path afterwards

#### Scenario: Processes outlive the timeout
- **WHEN** a process still has its cwd under the worktree path after the timeout
- **THEN** the script prints a warning naming the remaining PIDs, sends them SIGTERM, then SIGKILL to any still alive, and continues with removal

### Requirement: Removal leaves no directory or stale registration
After the wait, the script SHALL run `git worktree remove`, delete any remaining contents of the path with `rm -rf`, and run `git worktree prune`.

#### Scenario: Leftover files after git removal
- **WHEN** `git worktree remove` leaves files behind (or fails because untracked files reappeared)
- **THEN** the script deletes the directory and prunes the registration, so `git worktree list` no longer shows the path and the directory does not exist

### Requirement: Dry run prints the plan
With `-n`, the script SHALL print, for each worktree it would remove, the planned actions (close tab, wait for processes, remove worktree, delete branch) and SHALL NOT close tabs, signal processes, or touch files or branches.

#### Scenario: Dry run on a merged worktree
- **WHEN** `scripts/prune-worktrees.sh -n` runs and a sibling worktree's branch is merged
- **THEN** it prints the planned actions for that worktree, including any PIDs currently under its path, and the worktree, tab and branch are untouched

