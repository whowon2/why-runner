#!/bin/bash

cd data

# Read code and testcases from /app
if [ ! -f code.cpp ]; then
  echo "Missing code.cpp" >&2
  exit 1
fi

# Compile the code
g++ code.cpp -o code.out
if [ $? -ne 0 ]; then
  echo "Compilation failed" >&2
  exit 1
fi

sum = 0
total = 0

# Loop over input files
for input in input*.txt; do
  idx="${input//[!0-9]/}" # extract index
  expected="expected${idx}.txt"

  # Run the executable with input
  ./code.out < "$input" > "output${idx}.txt"

  # Compare output
  if diff -q "output${idx}.txt" "$expected" >/dev/null; then
    sum=$((sum + 1))
  fi

  total=$((total + 1))
done

echo "$sum/$total"
