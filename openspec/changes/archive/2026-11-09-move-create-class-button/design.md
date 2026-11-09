## Context

`ClassList` renders `PageHeader` plus a row with `JoinClassForm` and `CreateClassButton`. `CreateClassButton` also owns the `?createClass=1` trigger (nuqs `useQueryState` + mount effect, guarded by a ref), used by links elsewhere (e.g. the command palette / home) to create a class directly.

## Goals / Non-Goals

**Goals:** separate the create action from the join form so students don't click it by accident; keep it one click away for teachers; keep the query trigger.

**Non-Goals:** a teacher role, permission changes, a confirmation dialog on create.

## Decisions

- **Placement depends on `data.taught`.** Taught > 0: button in the "Turmas que você leciona" section header (where a teacher looks for it). Taught = 0: dashed hint box after the lists, visually secondary. Alternative (confirmation dialog) rejected: adds friction for teachers and doesn't fix the misleading layout.
- **Exactly one `CreateClassButton` mounted at a time.** The two placements are mutually exclusive, so the query-trigger effect fires once. While the list is loading no button renders; the trigger fires once it mounts after load, a short, acceptable delay.

## Risks / Trade-offs

- [Query trigger delayed until classes load] → acceptable; the mutation itself takes longer than the list query.
- [Users who only joined classes see the hint box] → intended: it's the discoverable path for a student who later starts teaching.
