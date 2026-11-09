## Context

`getAIHelp` takes `locale` from the client, maps it with `clampLocale` (`"en"` → `en`, anything else → `br`) and appends `Return your response in: <language>` to the prompt. The three authoring actions (`generateProblemNarrative`, `reviewProblem`, `generateReferenceSolution`) take no locale, and their prompts are English-only, so the model answers in English.

## Goals / Non-Goals

**Goals:**
- Narrative, review feedback/rationales and reference-solution comments follow the teacher's site language.
- Reuse the existing `clampLocale` / `LOCALE_LANGUAGE` helpers.

**Non-Goals:**
- Translating the system prompts themselves (the model handles English instructions fine).
- Tag suggestion: its output is `PROBLEM_TAGS` keys validated by a zod enum, rendered through i18n.
- Localizing server-side error messages thrown by these actions.

## Decisions

- **Client passes locale, server clamps it** (same as `getAIHelp`). The hooks call `useLocale()` internally, so the components calling them don't change. Alternative: `getLocale()` from `next-intl/server` inside the action. Rejected for consistency with the existing student path, and because the locale the teacher sees is the one in the URL the client already has.
- **Untrusted locale never reaches the prompt raw**: only `clampLocale(locale)` → `LOCALE_LANGUAGE[...]` is interpolated, so a forged value can't inject text.
- **Edge-case data stays verbatim**: the review prompt says to write `descriptionFeedback` and `rationale` in the language but keep `input`/`output` as exact test data, so a Portuguese locale doesn't translate numbers/strings the judge compares.
- **Reference solution**: instruct "any code comments in <language>"; the system prompt still says raw code only, so this only affects comments.

## Risks / Trade-offs

- [Model ignores the language line] → put it as the last line of the user prompt, as the student prompt does, which already works in practice.
- [Edge-case outputs translated by mistake, e.g. "SIM" vs "YES"] → explicit instruction that input/output follow the problem statement's own format; the teacher still reviews before adding.
