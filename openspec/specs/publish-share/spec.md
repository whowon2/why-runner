## Purpose

Defines the non-blocking share affordance shown after a contest or problem is published, replacing any blocking share dialog.

## Requirements

### Requirement: Non-blocking share affordance after publish
After a contest or problem is successfully published, the system SHALL show a share icon/button next to the publish confirmation instead of a blocking dialog, and SHALL NOT require any user interaction with it before the user can continue navigating.

#### Scenario: Publishing a problem shows a share icon, no dialog
- **WHEN** a creator successfully publishes a problem
- **THEN** the system shows a success confirmation and a share icon next to it, and does not open a modal dialog

#### Scenario: Publishing a contest shows a share icon, no dialog
- **WHEN** a creator successfully publishes a contest
- **THEN** the system shows a success confirmation and a share icon next to it, and does not open a modal dialog

#### Scenario: Using the share icon
- **WHEN** the creator clicks the share icon after a publish
- **THEN** the system copies a shareable link (or invokes the native share sheet where available) for that contest or problem, without navigating away or blocking further action

#### Scenario: Ignoring the share icon
- **WHEN** the creator does not interact with the share icon after publishing
- **THEN** the publish is unaffected — the contest or problem remains published and no error or reminder is shown
