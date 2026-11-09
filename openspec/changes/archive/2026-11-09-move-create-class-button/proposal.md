## Why

In the classroom test (2026-10-29) the professor reported that students hit "Criar turma" by mistake (survey review item P4): on `/classes` the button sits right beside the join-code form, which is the only control a student needs. Every user keeps the right to create a class (no teacher role, decided 2026-11-09), so the fix is placement, not permissions.

## What Changes

- Remove "Criar turma" from the page header next to the join-code form; the header keeps only the join form.
- When the user teaches at least one class, show the button next to the "Turmas que você leciona" heading.
- When the user teaches no class, show it in a separate dashed box below the class lists, with a hint ("Dá aulas? Crie uma turma e convide seus alunos com o código dela." / "Teaching a course? Create a class and invite your students with its code.").
- New `ClassesPage.teachHint` message in `en.json` and `br.json`.
- The `?createClass=1` query trigger keeps working (it lives in `CreateClassButton`, which stays mounted exactly once after the class list loads).

## Capabilities

### New Capabilities

### Modified Capabilities
- `classes`: adds a requirement on where the create-class control appears on the classes page, relative to the join form.

## Impact

- `web/app/[locale]/classes/_components/class-list.tsx`
- `web/messages/en.json`, `web/messages/br.json`
- No API, DB or judge changes. Web patch version bump.
