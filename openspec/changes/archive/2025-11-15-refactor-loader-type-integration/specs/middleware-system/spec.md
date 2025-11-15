## MODIFIED Requirements
### Requirement: Middleware Loading
The plugin SHALL load middleware from `app/io/middleware/` directories across all load units using FileLoader pattern.

#### Scenario: Middleware directory loading
- **WHEN** the plugin initializes
- **THEN** it SHALL scan all load units for `app/io/middleware/` directories
- **AND** all middleware files SHALL be loaded using FileLoader
- **AND** loaded middleware SHALL be accessible via `app.io.middleware[name]`

#### Scenario: Middleware export formats
- **WHEN** a middleware file is loaded
- **THEN** it SHALL support function exports (Koa-style middleware)
- **AND** it SHALL support class exports (instantiated automatically)
- **AND** it SHALL support object exports (factory results)
- **AND** all formats SHALL be converted to Koa-compatible middleware

#### Scenario: Middleware loader metadata
- **WHEN** middleware directories are enumerated across load units
- **THEN** the loader SHALL record the directory list so it can be reused by declaration tooling
- **AND** the same list SHALL be passed to `npx ets` so generated typings extend `CustomMiddleware` with actual middleware names
- **AND** runtime loading and declaration generation SHALL stay in sync even when additional frameworks/plugins add middleware directories

