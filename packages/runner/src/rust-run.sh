#!/bin/bash

dir="$1"

if [ -z "$dir" ]; then
  echo "Directory argument missing" >&2
  exit 1
fi

cd "$dir" || { echo "Failed to cd into $dir"; exit 1; }

# Check if code.rs exists
if [ ! -f code.rs ]; then
  echo "Missing code.rs" >&2
  exit 1
fi

# Compile
rustc code.rs -o code.out
if [ $? -ne 0 ]; then
  echo "Compilation failed" >&2
  exit 1
fi

# Run with input
./code.out < input.txt > result.txt

# Compare output
if diff -q result.txt output.txt >/dev/null; then
  echo "pass"
else
  echo "fail"
  echo "Expected output:"
  cat output.txt
  echo "Result:"
  cat result.txt
fi
