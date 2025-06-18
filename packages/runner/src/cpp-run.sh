#!/bin/bash

dir="$1"

if [ -z "$dir" ]; then
  echo "Directory argument missing" >&2
  exit 1
fi

cd "$dir" || { echo "Failed to cd into $dir"; exit 1; }

# Read code and testcases from /app
if [ ! -f code.cpp ]; then
  echo "Missing code.cpp" >&2
  exit 1
fi
if [ ! -f input.txt ]; then
  echo "Missing input.txt" >&2
  exit 1
fi
if [ ! -f output.txt ]; then
  echo "Missing output.txt" >&2
  exit 1
fi

# Compile the code
g++ code.cpp -o code.out
if [ $? -ne 0 ]; then
  echo "Compilation failed" >&2
  exit 1
fi

./code.out < input.txt > result.txt

# Compare output
if diff -q result.txt output.txt >/dev/null; then
    echo "pass"
else
    echo "fail"
    echo expected output: $(cat output.txt)
    echo result: $(cat result.txt)
fi
