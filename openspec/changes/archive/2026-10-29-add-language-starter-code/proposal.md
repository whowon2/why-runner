## Why

Picking a language today leaves the Monaco editor empty, so students (especially beginners) must remember each language's stdin/stdout boilerplate before writing any logic — and Java's required `public class Main` or Portugol's `programa { funcao inicio() }` shell trips people up and produces avoidable compile errors. A per-language starter template that shows how to read input and write output removes that friction, and a reset button lets users recover a clean template after experimenting.

## What Changes

- Add a single source of starter code per supported language (`c`, `cpp`, `java`, `python`, `rust`, `portugol`): a minimal compilable program that reads two integers from stdin and prints their sum to stdout, with short comments marking the "read input" and "write output" lines. Comment text follows the UI locale (en / pt-BR); code is identical across locales.
- When a user selects a language in a code editor, load that language's starter code if the editor is empty or still holds the untouched starter of the previously selected language. Code the user has written is never replaced on language switch.
- Contest editor: when the problem+language localStorage slot has no saved code, show the starter instead of an empty editor. An untouched starter is not written to the slot.
- Add a "Reset to starter code" button next to the existing editor toolbar buttons (disabled until a language is chosen). Resetting replaces the editor content with the current language's starter and offers an "Undo" toast action that restores the previous code.
- Apply to all three code editors: standalone problem workspace Submit tab, contest problem upload panel, and class exercise code mode.

## Capabilities

### New Capabilities
- `editor-starter-code`: per-language starter templates shown in code editors, rules for when they load on language selection, and the reset-to-starter action.

### Modified Capabilities
<!-- None: existing submit/save requirements are unchanged; starter behaviour is additive. -->

## Impact

- New: `web/lib/starter-code.ts` (templates + helpers), unit test alongside it, shared `ResetCodeButton` component in `web/components/`.
- Edited: `web/app/[locale]/problems/_components/workspace/submit.tsx`, `web/app/[locale]/contests/_components/tabs/problem/upload.tsx`, `web/app/[locale]/classes/_components/exercise-detail.tsx`.
- i18n: new keys in `web/messages/en.json` and `web/messages/br.json` (tooltip, toast, template comments).
- No DB, server action, or judge changes. Templates must respect judge conventions (Java class `Main`; Portugol run via console jar).
