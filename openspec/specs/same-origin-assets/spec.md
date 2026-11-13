# same-origin-assets Specification

## Purpose
The code editor, read-only code highlighting and block editor load every runtime asset from the WhyRunner origin, so they work in labs whose firewall allows only that domain.

## Requirements
### Requirement: Code editor loads Monaco from the app origin
The system SHALL load the Monaco editor (loader, editor core, language grammars, workers, CSS and fonts) only from the WhyRunner origin, never from a third-party CDN.

#### Scenario: Editor works with CDNs blocked
- **WHEN** a student opens a problem, contest problem or lesson exercise while `cdn.jsdelivr.net` and `unpkg.com` are unreachable
- **THEN** the code editor loads, highlights syntax (including Portugol), applies the app theme and accepts input

#### Scenario: Vim mode works with CDNs blocked
- **WHEN** a student with vim mode enabled opens the editor while third-party CDNs are unreachable
- **THEN** vim mode starts and its status line shows under the editor

### Requirement: Submitted-code highlighting loads Monaco from the app origin
The system SHALL colorize read-only submitted code with a Monaco instance loaded from the WhyRunner origin.

#### Scenario: Highlighting with CDNs blocked
- **WHEN** a teacher or student views submitted code while third-party CDNs are unreachable
- **THEN** the code is shown with syntax highlighting

### Requirement: Block editor loads its media from the app origin
The system SHALL configure Blockly to load its media (sprites, sounds, cursors) from the WhyRunner origin.

#### Scenario: Block editor with internet blocked
- **WHEN** a student opens a block-programming exercise while only the WhyRunner origin is reachable
- **THEN** the workspace's zoom controls and trashcan render, and the page makes no request to `static.blockly.com`

### Requirement: Served assets match installed packages
The system SHALL generate the served Monaco and Blockly files from the installed `monaco-editor` and `blockly` packages at install, dev and build time, and SHALL NOT commit them to the repository.

#### Scenario: Package upgrade
- **WHEN** `monaco-editor` or `blockly` is upgraded and the app is rebuilt
- **THEN** the files under `public/monaco/vs` and `public/blockly/media` come from the new version

