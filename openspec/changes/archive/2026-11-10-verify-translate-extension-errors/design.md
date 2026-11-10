## Context

Browser translators (Google Translate, extension-based translators) replace each text node they translate with a new `<font>`-wrapped node. React keeps references to the original text nodes; when it later removes or reorders them (`removeChild` / `insertBefore`), the node is no longer a child of the expected parent and React throws, which the app shows as a generic error. PR #81 put `translate="no"` + `notranslate` on code surfaces (editors, language selector, I/O blocks, verdict/diff views). The surrounding workspace chrome (toolbar buttons with pending/idle labels, verdict badges, counters, tabs) is still translatable, and that is where conditional text siblings live.

## Goals / Non-Goals

**Goals:**
- Establish, with a real translate extension in Helium, whether P9 still reproduces on lesson exercise and problem pages.
- If it does, fix the root cause with the smallest change that keeps prose translatable.

**Non-Goals:**
- Patching `Node.prototype.removeChild` / `insertBefore` globally (hides real bugs).
- Marking the document root `translate="no"` (the existing spec forbids it; translation of prose is wanted).

## Decisions

- **Verify before changing code.** Follow systematic debugging: reproduce, capture the exact console error and component stack, then fix only what is implicated.
- **Fix preference order** if a crash reproduces: (1) wrap bare conditional text (`{pending ? t("running") : t("run")}` next to an icon, `{count} {label}`) in its own `<span>` so React swaps an element, not a translated text node; (2) if a whole region keeps re-rendering text frequently (status/timer areas), mark that region `translate="no"`; (3) only as last resort, `translate="no"` on the workspace route container.
- **No change if nothing reproduces**; record the result in the evaluation docs.
- **Outcome (2026-11-09):** reproduced (`insertBefore` on Run all). Fixed at the shared root: `Button` wraps bare string/number children in `<span>` (not with `asChild`). The browser repro is timing-dependent (the translator rewrites asynchronously), so the remaining shapes were found with an AST scan of `app/` and `components/` for (a) a conditional child before bare text, (b) a conditional that yields bare text, (c) a ternary between two same-tag elements whose children differ (React reuses the element and swaps only an icon), plus early-return components with the same shape. Each was fixed by putting the text in its own element. Text→text changes only update `nodeValue` and were left alone. A jsdom harness (render, rewrite text nodes, re-render) confirmed the pre-fix `SolveStatus`/`MatchBadge` crash and the fixed ones don't.

## Risks / Trade-offs

- [Extension behaviour differs from Google Translate's built-in translator] → test with the extension the professor's setup resembles (installed in Helium) and note which one in the doc.
- [Crash depends on timing, e.g. translation applied after a re-render] → repeat each action several times (run twice, submit twice, toggle locale back and forth).
