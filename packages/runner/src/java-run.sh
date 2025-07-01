#!/bin/bash

dir="$1"
className="$2"

cd "$dir" || { echo "Failed to cd into $dir"; exit 1; }

# Verifica se os arquivos existem
if [ ! -f "$className.java" ]; then
  echo "Missing $className.java" >&2
  exit 1
fi
if [ ! -f input.txt ] || [ ! -f output.txt ]; then
  echo "Missing input/output" >&2
  exit 1
fi

# Compila
javac "$className.java"
if [ $? -ne 0 ]; then
  echo "Compilation failed" >&2
  exit 1
fi

# Executa
java "$className" < input.txt > result.txt

# Compara
if diff -q result.txt output.txt >/dev/null; then
  echo "pass"
else
  echo "fail"
  echo expected output: $(cat output.txt)
  echo result: $(cat result.txt)
fi
