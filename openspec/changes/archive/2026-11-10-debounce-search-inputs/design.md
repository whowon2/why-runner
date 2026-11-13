## Context

`ListPageHeader` renders `<Input value={search.value} onChange={e => search.onChange(e.target.value)}>`. Callers derive `search.value` from the URL (`useSearchParams` on problems, nuqs on contests/admin) and their `onChange` writes the URL and resets the page. So each keystroke is a navigation (contests: `shallow: false` → RSC refetch) plus a new React Query key → one `getProblems`/`getContests` server action per character. The list hooks already use `placeholderData: keepPreviousData`.

## Goals / Non-Goals

**Goals:** instant typing; one URL update + one request per typing pause; Back/Forward keeps the input in sync; one shared debounce helper.

**Non-Goals:** changing filter semantics, server-side search, plain local-state form fields (dialogs, lesson titles).

## Decisions

- **Debounce inside `ListPageHeader`, not in each caller.** All three lists share it, so one fix covers them and callers stay URL-driven (query key = URL = debounced value, page reset happens in their `onChange`, which now fires once). Alternative (debounce in each list) duplicates logic.
- **Local text + "last committed" ref for sync.** Local `text` state starts at `search.value`. A `useEffect` on `search.value` sets `text` when the external value differs from what this input last committed, which covers Back/Forward and clears without clobbering in-progress typing (our own commit echoes back equal to the ref). Rendering-time state adjustment would also work but the effect is clearer with the ref.
- **`useDebouncedCallback(fn, delay)`** keeps the latest `fn` in a ref, returns a stable function with `.cancel()` and `.flush()`, and clears its timer on unmount. **`useDebouncedValue(value, delay)`** is the `useState`+`setTimeout` pattern already in the picker/co-teacher hook. 300 ms for list pages, 250 ms kept for the comboboxes.
- **Enter flushes** the pending search for users who press it.
- **Contests `q` is shallow.** With `shallow: false`, the debounced (timer-fired) nuqs update started an RSC navigation that never committed in the browser test, so the list stayed unfiltered; from a key event it worked. The contests server page doesn't read `q` (`useContests` fetches client-side), so a shallow update is correct and also saves a server round trip per search.
- **Stdin in a ref.** `useCodeRunner` lives in `WorkspaceProvider`, so stdin state re-rendered every `useWorkspace()` consumer per key (measured 8.2 ms median / 24 ms p90 per key in dev vs 1.4 ms on the list search). Stdin now lives in a ref (`getStdin`/`setStdin`), `RunPanel` keeps the shown text in local state seeded from it, and `run()` reads the ref: 0.8 ms per key.
- **Not changed:** the tag picker's `CommandInput` filters a fixed ~30-item list locally in cmdk; the custom theme form already paints once per animation frame and commits on a debounce.

## Risks / Trade-offs

- [Navigating away within 300 ms drops the last keystrokes] → acceptable; the callback is canceled on unmount rather than navigating after leaving.
- [External change while typing overwrites text] → only when the URL changes to something we didn't commit, which is a user navigation.
