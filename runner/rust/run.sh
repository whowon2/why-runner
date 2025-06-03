#!/bin/bash

cd data

# Read code and testcases from /app
if [ ! -f code.rs ]; then
  echo "Missing code.rs" >&2
  exit 1
fi

# Compile the code
rustc code.rs -o code.out
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
