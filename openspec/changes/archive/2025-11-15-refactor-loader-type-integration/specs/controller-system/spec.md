## MODIFIED Requirements
### Requirement: Controller Loading
The plugin SHALL load controllers from `app/io/controller/` directories across all load units using Egg’s controller loader so metadata stays consistent with load-unit ordering.

#### Scenario: Controller directory loading
- **WHEN** the plugin initializes
- **THEN** it SHALL scan all load units for `app/io/controller/` directories
- **AND** all controller files SHALL be loaded using FileLoader
- **AND** loaded controllers SHALL be accessible via `app.io.controller[name]`

#### Scenario: Controller export formats
- **WHEN** a controller file is loaded
- **THEN** it SHALL support class exports with methods as event handlers
- **AND** it SHALL support object exports with method properties
- **AND** it SHALL support function exports as event handlers
- **AND** all formats SHALL work with the routing system

#### Scenario: Controller loader metadata
- **WHEN** controller directories are enumerated across all load units
- **THEN** the loader SHALL call Egg’s `loadController()` helper so controller metadata follows load-unit order
- **AND** the same directory list SHALL be exposed to tooling so `npx ets` can extend `CustomController` with the discovered controller names
- **AND** the metadata SHALL stay consistent between runtime loading and declaration generation

