## 1. Templates and helpers

- [x] 1.1 Create `web/lib/starter-code.ts` with `StarterComments` type, `Record<Language, (c) => string>` templates for c, cpp, java, python, rust, portugol (read two ints, print sum, locale comments on read/write lines), and `getStarterCode(language, comments)`
- [x] 1.2 Add pure `nextCodeOnLanguageChange(code, prev, next, comments)` (starter of `next` when code is blank or equals starter of `prev`, else code unchanged)
- [x] 1.3 Write `web/lib/starter-code.test.ts`: template for every enum value, Java contains `public class Main`, comments substituted, language-switch cases (blank, untouched starter, edited code, prev null)
- [x] 1.4 Add `StarterCode` namespace (`read`, `write`, `reset`, `resetDone`, `undo`) to `web/messages/en.json` and `web/messages/br.json`

## 2. Shared reset button

- [x] 2.1 Create `web/components/reset-code-button.tsx` (`RotateCcw` outline icon button + tooltip, disabled without language, no-op when code equals starter, `sonner` toast with Undo action calling `onUndo(previous)`)

## 3. Wire into editors

- [x] 3.1 Problem workspace (`problems/_components/workspace/submit.tsx`): wrap language `onValueChange` with `nextCodeOnLanguageChange`; add `ResetCodeButton` to toolbar
- [x] 3.2 Class exercise (`classes/_components/exercise-detail.tsx` `CodeExercise`): same language-change wrapper and reset button
- [x] 3.3 Contest upload (`contests/_components/tabs/problem/upload.tsx`): slot-switch effect falls back to starter instead of `""`; keep a `starterRef` for the mount-time blur listener
- [x] 3.4 Contest upload: `writeSlot` skips values equal to the slot language's starter (blur, `pagehide`, slot switch, manual save)
- [x] 3.5 Contest upload: add `ResetCodeButton`; on reset also `localStorage.removeItem(slotKey)` and clear the "saved at" indicator

## 4. Verification

- [x] 4.1 `bun test lib/starter-code.test.ts`, `bun run lint` and type-check pass in `web/`
- [x] 4.2 Submit each of the six templates unchanged against a problem with input `2 3` / output `5` on the local judge; all Accepted
- [ ] 4.3 Browser check (problem workspace, contest, class exercise) in pt-BR and en: starter loads on first select, switches when untouched, preserved when edited, reset + undo work, contest saved slot wins over starter and reset clears it after reload — partial: problem workspace verified (en + pt-BR, load/switch/preserve/reset/undo); contest + class exercise not browser-checked (no running contest or open code exercise in local DB)
