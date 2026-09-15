#!/usr/bin/env bash
# judge/deploy/smoke-test-isolate.sh
# Proves isolate's box init/run/cleanup cycle works inside the judge image
# under best-case local Docker privileges. Does NOT prove it works under
# Railway's (unknown, likely more restrictive) container constraints — see
# docs/superpowers/specs/2026-09-15-isolate-sandbox-migration-design.md,
# "Risks & validation".
set -euo pipefail

IMAGE="judge:isolate-dev"
docker build -t "$IMAGE" -f judge/Dockerfile judge

echo "--- isolate --version ---"
docker run --rm --cap-add=SYS_ADMIN --cap-add=NET_ADMIN "$IMAGE" isolate --version

echo "--- box init/run/cleanup ---"
# SYS_ADMIN: needed for isolate's mount/namespace/cgroup setup.
# NET_ADMIN: isolate creates a private network namespace per box and brings
#   up its loopback interface (SIOCSIFFLAGS) before running the sandboxed
#   process; without this cap that ioctl is denied and --run fails (exit 2)
#   even though --init succeeded.
docker run --rm --cap-add=SYS_ADMIN --cap-add=NET_ADMIN "$IMAGE" sh -c '
  set -e
  isolate --box-id=0 --init
  isolate --box-id=0 --run -- /bin/echo "hello from inside the box"
  isolate --box-id=0 --cleanup
'
echo "SMOKE TEST PASSED"
