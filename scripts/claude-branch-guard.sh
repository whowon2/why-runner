#!/usr/bin/env bash
# UserPromptSubmit hook: tell the agent which branch this checkout is on right now (the session-start
# git snapshot goes stale when someone else switches branches), and warn when another Claude session
# is running in the same directory, since that means two tasks share one working tree.
set -uo pipefail

cwd="$(jq -r '.cwd // empty' 2>/dev/null)"
cwd="${cwd:-$PWD}"

root="$(git -C "$cwd" rev-parse --show-toplevel 2>/dev/null)" || exit 0
branch="$(git -C "$root" branch --show-current)"
[ -n "$branch" ] || branch="(detached HEAD)"

# Our own claude process is the nearest `claude` ancestor of this hook.
self=""
p=$$
while [ "${p:-0}" -gt 1 ]; do
  if [ "$(ps -o comm= -p "$p" 2>/dev/null)" = "claude" ]; then self="$p"; break; fi
  p="$(ps -o ppid= -p "$p" 2>/dev/null | tr -d ' ')"
done

others=()
for pid in $(pgrep -x claude 2>/dev/null); do
  [ "$pid" = "$self" ] && continue
  other="$(readlink "/proc/$pid/cwd" 2>/dev/null)"
  case "$other" in "$root" | "$root"/*) others+=("$pid") ;; esac
done

ctx="Current git branch in $root: $branch (live value; ignore the session-start snapshot if it differs)."
if [ "${#others[@]}" -gt 0 ]; then
  warn="Another Claude session (pid ${others[*]}) is running in $root. Two tasks are sharing one checkout: do not start a new task here; use scripts/new-worktree.sh."
  jq -n --arg ctx "$ctx $warn" --arg msg "⚠ $warn" \
    '{systemMessage: $msg, hookSpecificOutput: {hookEventName: "UserPromptSubmit", additionalContext: $ctx}}'
else
  jq -n --arg ctx "$ctx" '{hookSpecificOutput: {hookEventName: "UserPromptSubmit", additionalContext: $ctx}}'
fi
