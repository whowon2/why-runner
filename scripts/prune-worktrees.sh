#!/usr/bin/env bash
# Remove sibling worktrees (made by new-worktree.sh) whose branch is merged into origin/main.
# Also deletes the local branch and closes the worktree's zellij tab (claude + dev server).
# Skips worktrees with uncommitted changes. Usage: scripts/prune-worktrees.sh [-n]  (-n = dry run)
# Waits up to PRUNE_WAIT_SECS (default 15) for the tab's processes to exit before removing,
# so a dying dev server can't write .next/, next-env.d.ts etc. back into the removed folder.
set -euo pipefail

dry=""
[ "${1:-}" = "-n" ] && dry=1
wait_secs="${PRUNE_WAIT_SECS:-15}"

root="$(git rev-parse --show-toplevel)"
prefix="$(dirname "$root")/$(basename "$root")-"
git -C "$root" fetch --quiet origin main

# PIDs whose cwd is <path> or inside it (a removed cwd reads as "<path> (deleted)").
pids_under() {
  local dir="$1" link cwd pid
  for link in /proc/[0-9]*/cwd; do
    cwd="$(readlink "$link" 2>/dev/null)" || continue
    cwd="${cwd% (deleted)}"
    [[ "$cwd" == "$dir" || "$cwd" == "$dir"/* ]] || continue
    pid="${link#/proc/}"
    pid="${pid%/cwd}"
    [[ "$pid" == "$$" || "$pid" == "${BASHPID:-}" ]] && continue
    echo "$pid"
  done
}

describe_pids() { # "123 (next-server) 456 (claude)"
  local pid out=""
  for pid in "$@"; do out+="$pid ($(cat "/proc/$pid/comm" 2>/dev/null || echo '?')) "; done
  echo "${out% }"
}

# Wait for processes under <path> to exit; after the timeout, TERM then KILL them.
wait_for_exit() {
  local dir="$1" name="$2" deadline pids
  deadline=$((SECONDS + wait_secs))
  while pids="$(pids_under "$dir")"; [ -n "$pids" ]; do
    if [ "$SECONDS" -ge "$deadline" ]; then
      # shellcheck disable=SC2086
      echo "warn    $name: still running after ${wait_secs}s, killing: $(describe_pids $pids)" >&2
      # shellcheck disable=SC2086
      kill -TERM $pids 2>/dev/null || true
      sleep 2
      pids="$(pids_under "$dir")"
      # shellcheck disable=SC2086
      [ -n "$pids" ] && { kill -KILL $pids 2>/dev/null || true; sleep 0.5; }
      return 0
    fi
    sleep 0.25
  done
}

git -C "$root" worktree list --porcelain | awk '/^worktree /{p=$2} /^branch /{print p" "$2}' |
while read -r path ref; do
  [[ "$path" == "$prefix"* ]] || continue
  branch="${ref#refs/heads/}"
  name="${path#"$prefix"}"

  merged=""
  tip="$(git -C "$root" rev-parse "$branch")"
  if grep -qx "$tip" <<<"$(git -C "$root" rev-list --first-parent origin/main)"; then
    : # tip sits on main's own history: branch has no commits of its own yet
  elif git -C "$root" merge-base --is-ancestor "$branch" origin/main; then
    merged=1
  elif command -v gh >/dev/null &&
    [ "$(cd "$root" && gh pr view "$branch" --json state -q .state 2>/dev/null || true)" = "MERGED" ]; then
    merged=1 # squash/rebase merge
  fi
  if [ -z "$merged" ]; then
    echo "keep    $name ($branch not merged)"
    continue
  fi
  if [ -n "$(git -C "$path" status --porcelain)" ]; then
    echo "skip    $name (merged, but has uncommitted changes)"
    continue
  fi

  tab_id=""
  if [ -n "${ZELLIJ:-}" ]; then
    tab_id="$(zellij action list-tabs --json | jq -r --arg n "$name" \
      '.[] | select((.name | sub("^(⏳|🔔|✅) "; "")) == $n) | .tab_id' | head -1)"
  fi

  if [ -n "$dry" ]; then
    echo "would remove $name ($branch)"
    [ -n "$tab_id" ] && echo "  close zellij tab $tab_id"
    live="$(pids_under "$path")"
    # shellcheck disable=SC2086
    [ -n "$live" ] && echo "  wait up to ${wait_secs}s for, then kill: $(describe_pids $live)"
    echo "  git worktree remove $path; rm -rf leftovers; git worktree prune"
    echo "  git branch -D $branch"
    continue
  fi

  [ -n "$tab_id" ] && zellij action close-tab --tab-id "$tab_id"
  wait_for_exit "$path" "$name"
  git -C "$root" worktree remove "$path" 2>/dev/null ||
    echo "warn    $name: git worktree remove failed, deleting the folder instead" >&2
  if [ -e "$path" ] && [ -n "$path" ] && [ "$path" != "$root" ]; then
    rm -rf -- "$path"
  fi
  git -C "$root" worktree prune
  git -C "$root" branch -D "$branch" >/dev/null
  echo "removed $name ($branch)"
done
