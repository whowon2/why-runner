#!/usr/bin/env bash
# Create a sibling git worktree for a parallel task, with env files and deps ready.
# Usage: scripts/new-worktree.sh <branch-name> [base-ref] [prompt]
#   scripts/new-worktree.sh feat/cmdk-commands        -> ../why-runner-cmdk-commands, based on main
# Gives the worktree its own dev port (3001+, recorded as DEV_PORT in web/.env.local, with
# BETTER_AUTH_URL pointed at it). Inside zellij, also opens a tab named after the worktree with
# `claude` (seeded with [prompt] if given) and `bun dev` on that port side by side.
set -euo pipefail

branch="${1:?usage: new-worktree.sh <branch-name> [base-ref]}"
base="${2:-main}"
prompt="${3:-}"

root="$(git rev-parse --show-toplevel)"
name="${branch##*/}"
dest="$(dirname "$root")/$(basename "$root")-$name"

if [ -e "$dest" ]; then
  echo "already exists: $dest" >&2
  exit 1
fi

if git -C "$root" show-ref --verify --quiet "refs/heads/$branch"; then
  git -C "$root" worktree add "$dest" "$branch"
else
  git -C "$root" worktree add "$dest" -b "$branch" "$base"
fi

# Gitignored env files don't come along with a worktree.
for dir in web judge; do
  for f in "$root/$dir"/.env*; do
    if [ -f "$f" ]; then cp "$f" "$dest/$dir/"; fi
  done
done

# Own dev port: skip ports in use and ports claimed by sibling worktrees.
claimed="$(cat "$(dirname "$root")/$(basename "$root")"-*/web/.env.local 2>/dev/null | sed -n 's/^DEV_PORT=//p' || true)"
port=3001
while ss -ltnH "sport = :$port" | grep -q . || grep -qx "$port" <<<"$claimed"; do
  port=$((port + 1))
done
env_local="$dest/web/.env.local"
touch "$env_local"
sed -i '/^DEV_PORT=/d; /^BETTER_AUTH_URL=/d' "$env_local"
printf 'DEV_PORT=%s\nBETTER_AUTH_URL="http://localhost:%s"\n' "$port" "$port" >>"$env_local"

(cd "$dest/web" && bun install)

echo
echo "worktree ready: $dest (branch $branch), dev server: http://localhost:$port"

if [ -n "${ZELLIJ:-}" ]; then
  if [ -n "$prompt" ]; then
    zellij action new-tab --name "$name" --cwd "$dest" -- claude "$prompt" >/dev/null
  else
    zellij action new-tab --name "$name" --cwd "$dest" -- claude >/dev/null
  fi
  zellij action new-pane --direction right --cwd "$dest/web" -- bun dev -p "$port" >/dev/null
  echo "opened zellij tab '$name': claude + bun dev on :$port"
else
  echo "start an agent there:  cd $dest && claude"
  echo "dev server:            cd $dest/web && bun dev -p $port"
fi
