## MODIFIED Requirements

### Requirement: Full contest configuration form
The Settings tab SHALL expose an editable form covering name, description, start date, end date, private/public toggle, and attached problems — replacing the previous Manage-tab edit form that only exposed name. The problem picker used to attach problems SHALL display each candidate problem's code and creator alongside its title, so problems sharing a title can be told apart.

#### Scenario: Editing all fields on a draft
- **WHEN** the creator changes name, description, start/end dates, privacy, and problem selection on a draft contest and saves
- **THEN** all changed fields are persisted

#### Scenario: Picking between same-titled problems
- **WHEN** the creator opens the problem picker and two or more candidate problems share the same title
- **THEN** each is shown with its distinct code and creator so the creator can identify the correct one before adding it
