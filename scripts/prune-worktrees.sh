#!/usr/bin/env bash
# Remove sibling worktrees (made by new-worktree.sh) whose branch is merged into origin/main.
# Also deletes the local branch and closes the worktree's zellij tab (claude + dev server).
# Skips worktrees with uncommitted changes. Usage: scripts/prune-worktrees.sh [-n]  (-n = dry run)
set -euo pipefail

dry=""
[ "${1:-}" = "-n" ] && dry=1

root="$(git rev-parse --show-toplevel)"
prefix="$(dirname "$root")/$(basename "$root")-"
git -C "$root" fetch --quiet origin main

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
  if [ -n "$dry" ]; then
    echo "would remove $name ($branch)"
    continue
  fi

  if [ -n "${ZELLIJ:-}" ]; then
    tab_id="$(zellij action list-tabs --json | jq -r --arg n "$name" \
      '.[] | select((.name | sub("^(⏳|🔔|✅) "; "")) == $n) | .tab_id' | head -1)"
    [ -n "$tab_id" ] && zellij action close-tab --tab-id "$tab_id"
  fi
  git -C "$root" worktree remove "$path"
  git -C "$root" branch -D "$branch" >/dev/null
  echo "removed $name ($branch)"
done
