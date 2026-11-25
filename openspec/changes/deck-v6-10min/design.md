## Context

v5 (`build_v5.py`) builds every slide from Python builders onto v3's package (theme recolored light). The committed v5.pptx matches a fresh rebuild (only a regenerated chart PNG not used in v6 differs), so there are no manual edits to preserve. v5 new slides get files `slide23.xml…`; the user's slide numbers (23 cover … 119 thanks) are those file numbers, i.e. v5 position + 22.

## Goals / Non-Goals

**Goals:** 25-slide, ~10-minute deck with the v5 look; reproducible build; notes ~1,300 words.

**Non-Goals:** new screenshots/charts, new benchmarks, thesis edits, changes to v5.

## Decisions

- **Reuse by import, not copy.** `build_v6.py` loads `build_v5.py` as a module (as v5 loads v4) and reuses `S`, the `b_*` builders, `shot`/`chart`, the data dicts (`AIR`, `PQ`, `CC`, `E2E`, `VD`, `SV`) and `build()`. Titles with numbers keep v5's f-strings so they still come from `bench/results`. Alternative (copy 1,000 lines) rejected: two places to fix.
- **Parameterize v5's `build()`/`lint()`** with `slides`, `out`, `listing` and a `track` callback (defaults = v5 behavior). Minimal diff; v5 output unchanged, checked by rebuilding into a scratch dir and diffing slide XML.
- **Progress bar instead of step tracker.** v5's per-section step chips lose meaning with 2–4 slides per section. v6 draws one chip per section (9) in the same top-right spot, smaller (9 pt mono), with three states: done (border color, muted text), current (green fill), next (outline). Kicker box stays at v5's narrowed width, so no overlap. Cover and thanks have no bar.
- **Notes**: written fresh in v6, short spoken sentences; numbers still interpolated from the result JSONs where v5 did.
- **PDF**: `soffice --headless --convert-to pdf`; locally via the `wsi-libreoffice` Docker image.

## Risks / Trade-offs

- [Bar crowds long kickers] → section names short; FIT lint checks the chips fit right of the kicker box.
- [Notes over budget] → build prints total words and minutes; lint flags slides over 70 note words.
- [Number in title drifts from notes] → both interpolate the same result dicts.
