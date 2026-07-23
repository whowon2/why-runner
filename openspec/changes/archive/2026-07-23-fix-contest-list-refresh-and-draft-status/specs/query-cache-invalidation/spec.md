## ADDED Requirements

### Requirement: Contest deletion refreshes contest lists
Deleting a contest SHALL invalidate cached contest list queries so the deleted contest no longer appears in any list view, and this invalidation SHALL be guaranteed by the mutation itself rather than depending on the calling component to trigger it.

#### Scenario: Deleted contest disappears from the contests list
- **WHEN** the creator deletes a contest from the Danger Zone and is redirected to the contests list page
- **THEN** the deleted contest is not shown in the list, without requiring a manual page refresh
