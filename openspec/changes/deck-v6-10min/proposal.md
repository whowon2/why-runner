## Why

The TCC II defense slot is 10 minutes, and deck v5 (98 slides, ~4,200 words of speaker notes) runs 30–35 minutes. A short cut of v5 is needed that keeps the story (problem → product → internals → numbers → evaluation → limits) and the v5 look, without rebuilding anything by hand.

## What Changes

- New deck `WhyRunner — Apresentação TCC II v6.pptx` + `.pdf` at the repo root: 25 slides chosen from v5 (cover, problem, research question, gap; professor 3; student 2; lessons 2; plagiarism 2; internals 2; performance 3; evaluation 4; limitation, next steps, thanks).
- No section dividers, no agenda, no references slide.
- The per-section step tracker becomes a deck-wide section progress bar (one chip per section, current one highlighted, done ones dimmed); kickers lose the "NN · " part-of-10 numbering.
- Speaker notes rewritten in spoken pt-BR: ~1,300 words total (~40–50 per slide, one key number per slide; the title is already the message).
- New builder `docs/presentation/build_v6.py` that reuses `build_v5.py`'s shapes, builders, data and package writer; `build_v5.py` gets a small, output-neutral refactor so `build()`/`lint()` take the slide list and output paths. Listing `docs/presentation/v6-slides.txt`.
- v1–v5 decks unchanged (v5 rebuild stays byte-identical in slide XML).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `presentation-deck`: adds the v6 10-minute defense cut (slide set, timing/notes budget, no dividers/agenda/references, section progress bar, reproducible build).

## Impact

- New: `docs/presentation/build_v6.py`, `docs/presentation/v6-slides.txt`, `WhyRunner — Apresentação TCC II v6.pptx`, `WhyRunner — Apresentação TCC II v6.pdf`.
- Edited: `docs/presentation/build_v5.py` (parameterized `build`/`lint`, no output change).
- Tooling: stdlib Python only; PDF via LibreOffice (`soffice`, or the local `wsi-libreoffice` Docker image).
- No application code, DB or judge changes.
