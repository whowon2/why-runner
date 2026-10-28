#!/usr/bin/env bash
# Runs one #[ignore]d bench test of judge/src/bench.rs inside the judge image
# (real isolate, SYS_ADMIN + NET_ADMIN), reading bench/judge/cases/<cases>.json
# and writing bench/results/<out>.csv.
#   bench/judge/run-rust-bench.sh <test_name> <cases> <out> [extra docker -e args...]
# Image: any judge final-stage image with a Rust toolchain added (see
# judge/CLAUDE.md); $RUST_IMAGE, default judge:concurrency-rust.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
TEST=$1 CASES=$2 OUTNAME=$3; shift 3
IMAGE=${RUST_IMAGE:-judge:concurrency-rust}
docker run --rm --cap-add=SYS_ADMIN --cap-add=NET_ADMIN \
  -e CARGO_TARGET_DIR=/target -v whyrunner-bench-target:/target \
  -v "$ROOT/judge":/src -v "$ROOT/bench":/bench -w /src \
  -e BENCH_CASES="/bench/judge/cases/$CASES.json" -e BENCH_OUT="/bench/results/$OUTNAME.csv" "$@" \
  --entrypoint sh "$IMAGE" -c \
  "mkdir -p /var/local/lib/isolate && mount -t tmpfs -o mode=0755,size=1g tmpfs /var/local/lib/isolate; \
   cargo test --release --quiet $TEST -- --ignored --nocapture --test-threads=1"
