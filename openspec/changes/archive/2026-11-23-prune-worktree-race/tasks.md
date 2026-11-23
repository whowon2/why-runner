## 1. Implementation

- [x] 1.1 Add `pids_under <path>` helper scanning `/proc/*/cwd`
- [x] 1.2 After close-tab, wait up to 15 s for no PIDs under path; on timeout warn, TERM, then KILL
- [x] 1.3 Run `git worktree remove`, then `rm -rf` leftovers, then `git worktree prune`
- [x] 1.4 Dry run prints planned actions, including live PIDs under the path

## 2. Verification

- [x] 2.1 `bash -n` and dry run (`-n`) on current worktrees
- [x] 2.2 Real run on a throwaway worktree made by `new-worktree.sh` with `bun dev` running in its tab; confirm dir gone and no `prunable` entry
