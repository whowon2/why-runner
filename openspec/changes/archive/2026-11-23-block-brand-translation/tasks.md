## 1. Brand

- [x] 1.1 Add `web/components/brand.tsx` with `<Brand>` (span, `translate="no"`, `notranslate`) and `withBrand(text)` splitter for "Why Runner"/"WhyRunner"
- [x] 1.2 Footer copyright: `<brand>` rich-text tag in `en.json`/`br.json`, render with `t.rich`
- [x] 1.3 Landing hero ("Uai/Why Runner") wrapped in `translate="no"`
- [x] 1.4 `LegalContent`: apply `withBrand` to plain text segments of intro, paragraphs and list items
- [x] 1.5 Surveys: apply `withBrand` where brand-bearing texts render (hub subtitle, consent text, SUS hint and items, feature items, open questions, CTA title, results labels)

## 2. Names and code surfaces

- [x] 2.1 Add `translate="no"` to user name / handle render sites (leaderboard, participants, pending joins, submissions table, roster, student sheet, gradebook, lesson review, admin tables, similarity report, contest problem author, profile)
- [x] 2.2 Audit code/I/O/language surfaces against the existing requirement; fix any gap

## 3. Document language

- [x] 3.1 `app/[locale]/layout.tsx`: `<html lang>` from locale (`br` → `pt-BR`, `en` → `en`); keep `global-error.tsx` at `lang="en"` (hardcoded English)

## 4. Verify and ship

- [x] 4.1 `bun lint`, typecheck (`bunx tsc --noEmit`), `bun test lib`
- [x] 4.2 Browser: DOM shows `translate="no"` on brand elements (footer, legal, home) and correct `html[lang]` on `/br` and `/en`
- [x] 4.3 Bump `web/package.json` patch version, commit, open PR
