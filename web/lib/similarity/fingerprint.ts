import type { Token } from "./tokenize";

export const DEFAULT_K = 5;
export const DEFAULT_W = 4;

/** A selected k-gram hash and the token index where that k-gram starts. */
export type Fingerprint = { hash: number; pos: number };

const FNV_OFFSET = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

function fnv(str: string, seed = FNV_OFFSET): number {
  let h = seed;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, FNV_PRIME);
  }
  return h >>> 0;
}

/** Hash of every run of `k` consecutive tokens; empty when there are fewer than `k`. */
export function kgramHashes(tokens: Token[], k = DEFAULT_K): number[] {
  const hashes: number[] = [];
  for (let i = 0; i + k <= tokens.length; i++) {
    let h = FNV_OFFSET;
    // \u0000 separates tokens so `a`,`bc` and `ab`,`c` hash differently.
    for (let j = i; j < i + k; j++) h = fnv(`${tokens[j].t}\u0000`, h);
    hashes.push(h);
  }
  return hashes;
}

/**
 * Winnowing (Schleimer, Wilkerson & Aiken 2003, the algorithm behind MOSS):
 * in every window of `w` consecutive k-gram hashes keep the minimum,
 * rightmost on ties, each position once. Any run of `w + k - 1` shared
 * tokens is guaranteed to share at least one selected fingerprint.
 */
export function winnow(hashes: number[], w = DEFAULT_W): Fingerprint[] {
  const out: Fingerprint[] = [];
  if (hashes.length === 0) return out;

  const windows = Math.max(1, hashes.length - w + 1);
  const size = Math.min(w, hashes.length);
  let last = -1;
  for (let s = 0; s < windows; s++) {
    let min = s;
    for (let j = s + 1; j < s + size; j++) {
      if (hashes[j] <= hashes[min]) min = j;
    }
    if (min !== last) {
      out.push({ hash: hashes[min], pos: min });
      last = min;
    }
  }
  return out;
}

export function fingerprint(
  tokens: Token[],
  k = DEFAULT_K,
  w = DEFAULT_W,
): Fingerprint[] {
  return winnow(kgramHashes(tokens, k), w);
}
