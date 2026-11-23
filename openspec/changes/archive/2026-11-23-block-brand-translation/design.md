## Context

Browser translators (Google Translate in Chrome, Edge Translator) skip any subtree with `translate="no"`; older Google Translate widgets also honour the `notranslate` class. The `translation-safe-rendering` spec (P9) already applies both to code, program I/O and language names. The brand name is rendered from many next-intl strings (footer, six legal pages, ~20 survey strings) and from a hand-built hero on the landing page. `app/[locale]/layout.tsx` hardcodes `<html lang="en">` although the default locale is `br`.

## Goals / Non-Goals

**Goals:**
- Brand name never machine-translated wherever it renders as page text.
- User names never machine-translated in lists and profile headers.
- `<html lang>` matches the locale so translators detect the source language correctly.

**Non-Goals:**
- Blocking translation of the whole page (`<meta name="google" content="notranslate">` or `translate="no"` on `<html>`).
- Document `<title>` and other attribute-only text (`alt`, `title`, placeholders): `translate` can't scope part of an attribute, and Chrome doesn't translate `<title>`.
- Verdict labels: they are localized words from `SubmissionStatus` messages, not raw codes, so they stay translatable.

## Decisions

- **`withBrand(text)` splitter over rich-text tags in every message.** Legal and survey texts mention the brand ~45 times per locale and are rendered through `t()`/`t.raw()` as plain strings (legal goes through `LegalContent`'s own inline parser). A regex splitter (`/Why ?Runner/g`) that returns `ReactNode[]` with each match in `<Brand>` keeps the messages untouched and can't drift when copy is edited. Alternative (a `<brand>` tag in each string + `t.rich`) needs every consumer to switch to `t.rich` and every translator to keep tags; rejected except for the footer, which already owns its one string.
- **Footer uses `t.rich` with `<brand>Why Runner</brand>`.** One string, server component, shows the intended tag style for future brand mentions.
- **`<Brand>` renders `<span translate="no" className="notranslate">`.** Inline span keeps typography; children default to "Why Runner" so callers can pass the exact spelling ("WhyRunner").
- **Locale → `lang` mapping in one helper** (`htmlLang(locale)`: `br` → `pt-BR`, else `en`), read in the root layout from `params`. `global-error.tsx` replaces the whole document with hardcoded English text and has no locale access, so `lang="en"` is correct there.
- **Usernames: attribute on the existing element**, no wrapper component; each site is a single `span`/`p`/`Link`.

## Risks / Trade-offs

- [Brand text inside an attribute (e.g. survey `title`) stays translatable] → acceptable; attributes are rarely translated and can't be partially marked.
- [Regex misses a new spelling like "Why-Runner"] → spec names the two spellings; new spellings must extend the regex.
- [Wrapping text in spans inside strings that also get React-reconciled] → spans are stable elements, which is the same safety pattern P9 relies on.
