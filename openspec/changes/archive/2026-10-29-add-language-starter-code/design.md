## Context

Three Monaco editors exist, each with its own `code` / `language` state and a hard-coded language `<Select>`:

- `web/app/[locale]/problems/_components/workspace/submit.tsx` — state lifted to `workspace/index.tsx` (`useState("")`), passed down as props.
- `web/app/[locale]/contests/_components/tabs/problem/upload.tsx` — local state plus per-`problem+language` localStorage slots (`code-${problemId}-${language}`), a slot-switch effect that saves the slot being left and loads the slot being entered (`setCode(stored ?? "")`), plus blur / `pagehide` autosave via `writeSlot`.
- `web/app/[locale]/classes/_components/exercise-detail.tsx` — `CodeExercise` with local state and a `LANGUAGES` array.

Judge conventions the templates must honour (`judge/src/runner.rs`): Java compiles `Main.java` and runs `java Main`; Portugol runs through `portugol-console.jar` on `script.por`; Rust/C/C++ compiled normally; Python run as a script. All read stdin, all graded on stdout.

## Goals / Non-Goals

**Goals:**
- One place that defines starter code for every `Language` value, type-checked against the enum.
- Identical starter/reset behaviour in all three editors via a shared helper + button component.
- Never destroy user-written code implicitly; reset is explicit and undoable.

**Non-Goals:**
- Per-problem or teacher-authored templates (could layer on later; would need a DB column).
- Preselecting a language (e.g. exercise `primaryLanguage`) or remembering the last language.
- Unifying the three hard-coded language `<Select>` lists (separate cleanup).
- Warning when a user submits the unmodified starter.

## Decisions

**1. Templates live in `web/lib/starter-code.ts` as `Record<Language, (c: StarterComments) => string>`.**
`StarterComments = { read: string; write: string }`. `getStarterCode(language, comments)` returns the program; callers pass `{ read: t("read"), write: t("write") }` from a new `StarterCode` i18n namespace. `Record<Language, …>` makes a missing language a type error, mirroring the existing `EXTENSIONS: Record<Language, string[]>` pattern in `submit.tsx`.
*Alternative:* full templates per locale in `messages/*.json` — rejected: duplicates code six times per locale, multi-line code in JSON is unreadable, and drift between locales is likely. *Alternative:* English-only comments — rejected: primary audience is pt-BR students.

Comment syntax per language: `//` for C, C++, Java, Rust, Portugol; `#` for Python. Templates (read two ints, print sum):
- C: `scanf("%d %d", &a, &b)` / `printf("%d\n", a + b)`
- C++: `std::cin >> a >> b` / `std::cout << a + b << '\n'` (with `ios::sync_with_stdio(false)` omitted to keep it minimal)
- Java: `public class Main` + `Scanner(System.in)`, `nextInt()` / `System.out.println`
- Python: `a, b = map(int, input().split())` / `print(a + b)`
- Rust: `read_to_string` on `io::stdin()` + `split_whitespace().map(parse)` / `println!` — handles numbers on one or multiple lines
- Portugol: `programa { funcao inicio() { inteiro a, b  leia(a, b)  escreva(a + b, "\n") } }`


**2. Pure helper `nextCodeOnLanguageChange(code, prev, next, comments)`** in the same module returns the code to show after a switch: starter of `next` if `code.trim() === ""` or `code === starter(prev)`, else `code`. Being pure, it is unit-tested with `bun test` (`starter-code.test.ts`, next to existing `lib/blocks/portugol-generator.test.ts`). Each editor wraps its `setLanguage` with it. For the workspace, the wrapper lives in `submit.tsx`'s `onValueChange` (state stays lifted).

**3. Contest slot integration.**
- Slot-switch effect: `setCode(stored ?? starter(language))` instead of `?? ""`. The existing "code typed before any language was chosen" branch is unchanged (only fires when `prev` is null and code is non-empty).
- `writeSlot` skips writing when `value === starter(language-of-key)`. Simplest: pass the current starter into the guard alongside the existing empty-code guard; the blur listener reads it through a ref like `codeRef`.
- Reset in contest also calls `localStorage.removeItem(slotKey)` so a reload after reset shows the starter, not the pre-reset save. Undo restores the editor content; the next blur/`pagehide`/manual save writes it back.

**4. Shared `ResetCodeButton` component** (`web/components/reset-code-button.tsx`): props `{ language, code, onReset(starter), onUndo(previous) }`. Renders an outline icon button (`RotateCcw` from lucide) wrapped in the same `Tooltip` pattern the toolbars already use, `disabled={!language}`. On click: if `code === starter` do nothing; else call `onReset`, then `toast(t("resetDone"), { action: { label: t("undo"), onClick: () => onUndo(previous) }, duration: 8000 })` (8s, since the 4s default expired before users could reach Undo) — same `sonner` action pattern already used in `upload.tsx`. Placed before the submit button in each toolbar.
*Alternative:* confirmation dialog — rejected: extra click every time; undo toast is cheaper and the codebase already uses toast actions for recoverable choices.

**5. i18n:** new `StarterCode` namespace (`read`, `write`, `reset` tooltip, `resetDone`, `undo`) in `en.json` and `br.json`.

## Risks / Trade-offs

- [Locale switch changes starter text → an untouched starter from the old locale no longer equals the new starter, so language switch would keep it] → Locale switch is a navigation that remounts editors with empty state (contest slots never store untouched starters), so in practice this does not arise.
- [Unmodified starter can be submitted by mistake] → It just gets Wrong Answer; acceptable, explicitly a non-goal.
- [Template rots if judge toolchain changes (e.g. Portugol syntax, Java class name)] → Task to submit each template once against a local judge; unit test asserts `public class Main` in Java template.
- [Contest blur listener is registered once on mount and would see a stale starter] → read the current starter via a ref, matching the existing `codeRef` / `slotKeyRef` pattern.

## Migration Plan

Frontend-only; ships with a normal deploy. Rollback = revert. Existing localStorage slots are untouched and keep loading as before.

## Open Questions

- None blocking. Possible follow-up: teacher-authored per-problem starter code.
