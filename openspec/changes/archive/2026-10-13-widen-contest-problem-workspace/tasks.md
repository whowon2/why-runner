## 1. Responsive helper

- [x] 1.1 Add `web/hooks/use-media-query.ts`: `useMediaQuery(query: string): boolean` built on `useSyncExternalStore` + `window.matchMedia` (subscribe to `change`; server snapshot `false`)

## 2. Per-tab width in ContestTabs

- [x] 2.1 In `web/app/[locale]/contests/_components/tabs/index.tsx`, drop the outer wrapper's extra `p-4` and remove `max-w-6xl` from `<Tabs>`
- [x] 2.2 Keep the tab bar row (TabsList + publish button) and the Leaderboard/Settings/Manage `TabsContent` at `max-w-6xl mx-auto w-full`
- [x] 2.3 Give the Problems `TabsContent` a wide cap (`max-w-[1800px] mx-auto w-full`)

## 3. ProblemTab panel layout

- [x] 3.1 In `tabs/problem/index.tsx`, use `useMediaQuery("(min-width: 1024px)")` to choose `direction` = `horizontal` (lg+) or `vertical`
- [x] 3.2 Horizontal: give the `ResizablePanelGroup` a viewport-based height (`h-[calc(100dvh-8rem)] min-h-[560px]`, tune the offset visually)
- [x] 3.3 Statement panel: `defaultSize={45} minSize={25}`, `overflow-y-auto`, gutter `pr-3` (horizontal) / `pb-3` (vertical); when the editor panel is not rendered it takes the full width
- [x] 3.4 Editor panel: `defaultSize={55} minSize={30}`, `flex flex-col min-h-0`, gutter `pl-3` / `pt-3`
- [x] 3.5 Vertical: stacked panels with the statement at natural height or scrolling and the editor around `70dvh`; make sure the `ResizableHandle` orientation and look fit vertical mode
- [x] 3.6 Reduce the outer `Card`/`CardContent` padding if it still doubles up with the panel gutters

## 4. Editor fills its panel

- [x] 4.1 In `tabs/problem/upload.tsx`, drop `max-h-screen` and the inner `CardContent` horizontal padding so the toolbar and Monaco span the panel edge to edge
- [x] 4.2 Make sure Monaco's wrapper is `flex-1 min-h-0` so `height="100%"` resolves to the panel's remaining height under the toolbar

## 5. Verify

- [x] 5.1 `bun run lint` (no new errors vs baseline) + `tsc --noEmit` passes
- [ ] 5.2 Manual check at 1920px: workspace much wider than the header card, editor about one screen tall for a short problem (e.g. A+B), long statement scrolls inside its panel
- [ ] 5.3 Manual check: default split ~45/55, the handle clamps at the min sizes, a solved/ended problem shows the statement at full width
- [ ] 5.4 Manual check at 768px: statement stacked above the editor; typed code survives resizing across the 1024px breakpoint
- [ ] 5.5 Leaderboard/Settings/Manage tabs render at their previous width
