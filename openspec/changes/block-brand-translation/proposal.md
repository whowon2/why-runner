## Why

With Chrome/Edge page translation on, the brand name "Why Runner"/"WhyRunner" is machine-translated (e.g. "Por que corredor") in the header hero, footer, legal pages and surveys. The next-intl messages already keep the name as-is; the browser translator is what rewrites it. Separately, `<html lang="en">` is hardcoded for every locale, so Chrome offers to translate Portuguese (`/br`) pages as if they were English.

## What Changes

- New shared `<Brand />` component (`translate="no"` + `notranslate`) and a `withBrand(text)` helper that wraps every "Why Runner"/"WhyRunner" occurrence inside a translated string.
- Brand marked non-translatable in the landing hero, footer copyright (rich-text `<brand>` tag), legal pages (`LegalContent` inline renderer) and survey texts that mention it.
- Usernames and display names in lists (leaderboard, participants, roster, gradebook, admin tables, similarity report, profile) marked `translate="no"`.
- Audit of code surfaces (already covered by `translation-safe-rendering`): fill any gap found.
- `<html lang>` follows the active locale (`br` → `pt-BR`, `en` → `en`). `global-error.tsx` renders hardcoded English, so it keeps `lang="en"`.
- No whole-page `<meta name="google" content="notranslate">`: the rest of the UI stays translatable.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `translation-safe-rendering`: adds requirements that the brand name and user names opt out of page translation, and that the document language matches the active locale.

## Impact

- `web/components/brand.tsx` (new), `web/components/footer.tsx`, `web/components/legal-content.tsx`, `web/app/[locale]/page.tsx`, `web/app/[locale]/layout.tsx`, survey components under `web/app/[locale]/surveys/_components/`, username render sites.
- `web/messages/en.json`, `web/messages/br.json`: `Footer.copyright` gains a `<brand>` tag.
- No DB, judge or API changes. Web patch version bump.
