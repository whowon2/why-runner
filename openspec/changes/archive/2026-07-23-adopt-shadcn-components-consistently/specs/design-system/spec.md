## ADDED Requirements

### Requirement: Shared primitive reuse for common UI patterns
Where a shared `web/components/ui/` primitive already exists for a UI pattern (loading state, empty/no-results state, pagination controls, section dividers), page and feature components SHALL use that primitive instead of a page-local hand-rolled implementation of the same pattern.

#### Scenario: Button loading state uses LoadingSwap
- **WHEN** an action button (e.g. create, publish, delete) enters a pending/loading state
- **THEN** it renders its loading indicator via the `LoadingSwap` primitive (directly or through `ActionButton`) rather than a page-local `Loader`+ternary

#### Scenario: List loading state uses Skeleton
- **WHEN** a list-style page section (e.g. the problems list) is loading its data
- **THEN** it renders `Skeleton` placeholders shaped like the eventual rows rather than a centered spinner icon

#### Scenario: Empty/no-results state uses Empty composition
- **WHEN** a list-style page or section has no items to display (no results, no submissions, no pending items)
- **THEN** it renders the state using the `Empty`/`EmptyHeader`/`EmptyMedia`/`EmptyTitle`/`EmptyDescription` composition rather than page-local icon/title/description markup

#### Scenario: Paginated list uses shared pagination controls
- **WHEN** a list-style page renders prev/next pagination controls with a page count and item range
- **THEN** it renders those controls via the shared pagination component built on the shadcn `Pagination` primitive rather than a page-local copy of the prev/next JSX

#### Scenario: Standalone section divider uses Separator
- **WHEN** a component renders a purely visual horizontal divider between two sections (not a border that also defines a container's outline)
- **THEN** it renders that divider using the `Separator` primitive rather than a `border-t` utility class
