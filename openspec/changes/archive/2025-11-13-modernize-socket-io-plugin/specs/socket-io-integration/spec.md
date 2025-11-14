## ADDED Requirements

### Requirement: Socket.IO Server Initialization
The plugin SHALL initialize a Socket.IO server instance and attach it to the Egg.js application.

#### Scenario: Server initialization on app load
- **WHEN** the plugin is enabled in the Egg.js application
- **THEN** a Socket.IO server instance SHALL be created and accessible via `app.io`
- **AND** the server SHALL be configured with `serveClient(false)` by default
- **AND** the server SHALL be attached to the HTTP server when it becomes available

#### Scenario: Lazy initialization
- **WHEN** `app.io` is accessed
- **THEN** the Socket.IO server instance SHALL be created if it doesn't exist
- **AND** subsequent accesses SHALL return the same instance

#### Scenario: HTTP server attachment
- **WHEN** the HTTP server is ready (via `app.on('server')` event)
- **THEN** the Socket.IO server SHALL attach to the HTTP server
- **AND** the `init` configuration options SHALL be passed to engine.io
- **AND** a custom `generateId` function SHALL be registered if configured

### Requirement: Configuration Management
The plugin SHALL use `config.teggSocketIO` for all configuration (not `config.io`).

#### Scenario: Configuration access
- **WHEN** the plugin initializes
- **THEN** it SHALL read configuration from `app.config.teggSocketIO`
- **AND** default configuration SHALL be provided if not specified
- **AND** namespace configuration SHALL default to empty object if not provided

### Requirement: Lifecycle Integration
The plugin SHALL integrate with Egg.js application lifecycle hooks.

#### Scenario: Namespace initialization timing
- **WHEN** `app.beforeStart()` hook executes
- **THEN** all configured namespaces SHALL be initialized
- **AND** connection and packet middleware SHALL be composed and registered
- **AND** event handlers SHALL be registered for each namespace

