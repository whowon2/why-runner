## ADDED Requirements

### Requirement: Create-class control is separate from the join form
The classes page SHALL NOT place the create-class control next to the join-code form. When the user teaches at least one class, the control SHALL appear next to the "classes you teach" section heading. When the user teaches no class, the control SHALL appear in a separate box below the class lists, with a hint explaining that teachers create a class and invite students with its code. The `?createClass=1` query parameter SHALL still create a class and open it.

#### Scenario: User who teaches classes
- **WHEN** a user who owns or co-teaches at least one class opens `/classes`
- **THEN** the create-class button appears beside the "classes you teach" heading and not beside the join form

#### Scenario: User who teaches no class
- **WHEN** a user who teaches no class opens `/classes`
- **THEN** the header shows only the join form, and the create-class button appears in a separate dashed box with the teaching hint

#### Scenario: Query trigger
- **WHEN** a user opens `/classes?createClass=1`
- **THEN** exactly one class is created and the user is redirected to it; `?createClass=true` behaves the same
