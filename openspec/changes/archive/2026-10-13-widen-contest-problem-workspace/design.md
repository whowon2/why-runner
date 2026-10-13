## Context

The contest page (`web/app/[locale]/contests/[slug]/page.tsx`) renders `ContestDescription` and `ContestTabs`. `ContestTabs` wraps every tab in `<Tabs className="w-full flex-1 max-w-6xl mx-auto">`, so the Problems tab is capped at 72rem like Leaderboard/Settings. Inside, `ProblemTab` renders a `Card` → `CardContent` → `ResizablePanelGroup direction="horizontal"` with two panels: statement + submissions (`pr-4`) and `UploadCode` (`pl-4`). `UploadCode` is another `Card` with `CardContent` padding and `h-full max-h-screen`, and Monaco uses `height="100%"`.

Result (see the screenshot that came with the request): wide empty gutters, a ~50/50 split with no default sizes, editor height equal to whatever the statement column happens to be, and four layers of padding (`p-4` page, `p-4` tabs wrapper, card padding, panel `pr-4`/`pl-4` + inner card padding).

`react-resizable-panels` v3 is already used through `@/components/ui/resizable`. Its `defaultSize`/`minSize` are percentages, and `direction` is a prop (not CSS), so switching orientation responsively needs JS.

## Goals / Non-Goals

**Goals:**
- Problems tab uses nearly full viewport width on large screens.
- Statement/editor area has viewport-derived height; editor is tall no matter how short the statement is; statement scrolls on its own.
- Sensible default and minimum panel sizes.
- Stacked (vertical) layout below the `lg` breakpoint.
- Less nested padding.

**Non-Goals:**
- Changing the standalone problem page (`/problems/[slug]`) workspace.
- Changing contest header/description card, Leaderboard, Settings, or Manage tab widths.
- Persisting the user's panel sizes (possible later via `autoSaveId`).
- Editor feature changes (language select, save, upload behavior).

## Decisions

1. **Per-tab width instead of a global cap.** Remove `max-w-6xl` from `<Tabs>` and move it onto the tab bar row and the non-problem `TabsContent`s. The Problems `TabsContent` gets a wide cap (`max-w-[1800px]`, i.e. effectively full width with a ceiling for ultrawide monitors).
   - *Alternative:* full-bleed with no cap at all. Rejected: on 3440px monitors line length of the statement becomes unreadable; the ceiling costs nothing on normal screens.
   - *Alternative:* a separate route for the solving view. Rejected: much larger change, breaks `?tab=` linking.
   - Header/tab bar stays at `max-w-6xl` and the problem area below it gets wider. That looks fine because the problem area is a separate card. If it looks odd during implementation, widen the tab bar row to match the problem area.

2. **Viewport-based height for the panel group.** Give the `ResizablePanelGroup` an explicit height like `h-[calc(100dvh-8rem)] min-h-[560px]` on `lg+`. Each panel gets `overflow-y-auto` (statement side) / `flex flex-col min-h-0` (editor side) so content scrolls inside rather than stretching the group. Monaco keeps `height="100%"` and now resolves against a real height.
   - *Alternative:* fixed pixel height on the editor (e.g. 600px). Rejected: wastes space on tall screens and overflows short ones.
   - The page still scrolls normally to reach the header; the workspace is simply one screen tall.

3. **Panel sizes.** Statement `defaultSize={45} minSize={25}`, editor `defaultSize={55} minSize={30}`. When the editor panel is not rendered (contest over, problem solved, not a participant), the statement panel is the only child and takes 100%.

4. **Responsive orientation via a small hook.** Add `web/hooks/use-media-query.ts` built on `useSyncExternalStore` + `window.matchMedia` (server snapshot `false`). `ProblemTab` uses `useMediaQuery("(min-width: 1024px)")` to pick `direction="horizontal"` vs `"vertical"`. In vertical mode the group drops the fixed-viewport height in favor of stacked panels with their own heights (statement auto/scroll, editor ~70dvh).
   - *Alternative:* render both layouts and hide one with CSS. Rejected: mounts two Monaco editors with separate code state.
   - *Alternative:* keep horizontal on mobile. Rejected: that is the current cramped behavior, just worse.
   - Hydration: the server snapshot is `false` (vertical). Desktop clients re-render to horizontal right after hydration. That is acceptable for a client component already gated on `useContest` loading, and `useSyncExternalStore` avoids hydration-mismatch errors.

5. **Trim padding.** Remove the extra `p-4` on the `ContestTabs` outer wrapper (the page already pads). Reduce `UploadCode`'s card to no inner padding (`p-0`/`px-0`) and drop `max-h-screen`, since the panel now sets the height. Panel gutters become `pr-3`/`pl-3`.

## Risks / Trade-offs

- [Brief layout flip from vertical to horizontal on desktop after hydration] → Content is client-fetched and appears after loading anyway, so the flip is rarely visible. If it is noticeable, render the group only after mount.
- [The `calc(100dvh - X)` offset doesn't match the actual header/tab-bar height] → Keep `min-h` as the floor. The aim is roughly one screen tall, not pixel-exact, so tune X visually.
- [Submissions list under the statement gets pushed below the fold on long statements] → The statement panel scrolls as a whole (statement + submissions), which matches current behavior inside a bounded box.
- [Wider statement lines are harder to read] → The 1800px ceiling plus the 45% default keeps the statement column at ~800px max.

## Migration Plan

Pure frontend layout change, no data or API impact. Ship as one PR; roll back by reverting.

## Open Questions

- Should panel sizes persist per user (`autoSaveId="contest-problem-split"`)? Cheap to add. Left out by default, can be folded in during implementation if wanted.
