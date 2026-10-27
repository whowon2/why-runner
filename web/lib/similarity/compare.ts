import { DEFAULT_K, type Fingerprint } from "./fingerprint";
import type { Token } from "./tokenize";

/** A tokenized + fingerprinted program, built once per submission. */
export type PreparedDoc = { tokens: Token[]; fingerprints: Fingerprint[] };

/** Character ranges `[start, end)` of one matched region, in A and in B. */
export type MatchRegion = { a: [number, number]; b: [number, number] };

export type PairComparison = {
  /** Matched tokens of both sides over all tokens of both sides, in [0, 1]. */
  similarity: number;
  coverageA: number;
  coverageB: number;
  /** Sorted by position in A; region i in A pairs with region i in B. */
  regions: MatchRegion[];
};

type Tile = { i: number; j: number; len: number };

/**
 * Greedy string tiling seeded by shared winnowed fingerprints: each shared
 * fingerprint gives a seed (i in A, j in B) that is extended backward and
 * forward while normalized tokens are equal; tiles are then accepted longest
 * first unless they overlap an accepted tile on either side. Tiles shorter
 * than `k` are dropped. `ignore` holds hashes that never seed a match
 * (boilerplate shared by most of the class, see ./report.ts).
 */
export function comparePair(
  a: PreparedDoc,
  b: PreparedDoc,
  { k = DEFAULT_K, ignore }: { k?: number; ignore?: Set<number> } = {},
): PairComparison {
  const ta = a.tokens;
  const tb = b.tokens;
  const empty = { similarity: 0, coverageA: 0, coverageB: 0, regions: [] };
  if (ta.length < k || tb.length < k) return empty;

  const inB = new Map<number, number[]>();
  for (const fp of b.fingerprints) {
    if (ignore?.has(fp.hash)) continue;
    const list = inB.get(fp.hash);
    if (list) list.push(fp.pos);
    else inB.set(fp.hash, [fp.pos]);
  }

  const seen = new Set<string>();
  const tiles: Tile[] = [];
  for (const fp of a.fingerprints) {
    const positions = inB.get(fp.hash);
    if (!positions) continue;
    for (const pos of positions) {
      let i = fp.pos;
      let j = pos;
      while (i > 0 && j > 0 && ta[i - 1].t === tb[j - 1].t) {
        i--;
        j--;
      }
      const key = `${i}:${j}`;
      if (seen.has(key)) continue;
      seen.add(key);

      let len = 0;
      while (
        i + len < ta.length &&
        j + len < tb.length &&
        ta[i + len].t === tb[j + len].t
      )
        len++;
      // `len < k` also filters hash collisions.
      if (len >= k) tiles.push({ i, j, len });
    }
  }

  tiles.sort((x, y) => y.len - x.len || x.i - y.i || x.j - y.j);

  const markedA = new Uint8Array(ta.length);
  const markedB = new Uint8Array(tb.length);
  const accepted: Tile[] = [];
  for (const tile of tiles) {
    let free = true;
    for (let n = 0; n < tile.len && free; n++) {
      if (markedA[tile.i + n] || markedB[tile.j + n]) free = false;
    }
    if (!free) continue;
    markedA.fill(1, tile.i, tile.i + tile.len);
    markedB.fill(1, tile.j, tile.j + tile.len);
    accepted.push(tile);
  }

  accepted.sort((x, y) => x.i - y.i);
  const matched = accepted.reduce((sum, t) => sum + t.len, 0);

  return {
    similarity: (2 * matched) / (ta.length + tb.length),
    coverageA: matched / ta.length,
    coverageB: matched / tb.length,
    regions: accepted.map(({ i, j, len }) => ({
      a: [ta[i].start, ta[i + len - 1].end],
      b: [tb[j].start, tb[j + len - 1].end],
    })),
  };
}
