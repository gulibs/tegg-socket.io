## ADDED Requirements

### Requirement: Namespace Configuration
The plugin SHALL support multiple Socket.IO namespaces via configuration.

#### Scenario: Namespace definition
- **WHEN** namespaces are configured in `config.teggSocketIO.namespace`
- **THEN** each namespace path (e.g., `/`, `/example`) SHALL be initialized
- **AND** each namespace SHALL have independent middleware configuration
- **AND** each namespace SHALL support separate connection and packet middleware

#### Scenario: Default namespace
- **WHEN** no namespace configuration is provided
- **THEN** an empty namespace object SHALL be used
- **AND** the default namespace (`/`) SHALL NOT be automatically created
- **AND** namespaces SHALL only be created if explicitly configured

### Requirement: Per-Namespace Middleware
Each namespace SHALL support independent connection and packet middleware configuration.

#### Scenario: Namespace middleware independence
- **WHEN** multiple namespaces are configured
- **THEN** each namespace SHALL have its own `connectionMiddleware` array
- **AND** each namespace SHALL have its own `packetMiddleware` array
- **AND** middleware changes in one namespace SHALL NOT affect others

#### Scenario: Namespace middleware resolution
- **WHEN** a namespace specifies middleware names in its configuration
- **THEN** middleware SHALL be resolved from the global `app.io.middleware`
- **AND** the same middleware can be reused across multiple namespaces
- **AND** an error SHALL be thrown if middleware is not found

### Requirement: Namespace Initialization
Namespaces SHALL be initialized during application startup.

#### Scenario: Namespace setup timing
- **WHEN** `app.beforeStart()` hook executes
- **THEN** all configured namespaces SHALL be initialized
- **AND** connection middleware SHALL be registered via `nsp.use()`
- **AND** packet middleware SHALL be registered via `socket.use()` for each connection
- **AND** event handlers SHALL be registered from router configuration

#### Scenario: Namespace access
- **WHEN** a namespace is configured
- **THEN** it SHALL be accessible via `app.io.of(namespacePath)`
- **AND** it SHALL be a standard Socket.IO Namespace instance
- **AND** it SHALL support Socket.IO namespace operations (rooms, emit, etc.)

### Requirement: Router Configuration Storage
The plugin SHALL store router configuration on namespaces using Symbols.

#### Scenario: Router symbol storage
- **WHEN** event routes are registered for a namespace
- **THEN** the routes SHALL be stored on the namespace using a Symbol key
- **AND** the symbol SHALL be accessible internally for event registration
- **AND** the router configuration SHALL persist for the lifetime of the namespace

#### Scenario: Multiple route registration
- **WHEN** multiple event routes are registered for a namespace
- **THEN** all routes SHALL be stored in the same router configuration map
- **AND** each event name SHALL map to its handler function
- **AND** routes SHALL not conflict with each other

### Requirement: Namespace Connection Handling
Each namespace SHALL handle socket connections independently.

#### Scenario: Connection event handling
- **WHEN** a socket connects to a namespace
- **THEN** connection middleware for that namespace SHALL execute
- **AND** packet middleware SHALL be registered for that specific socket
- **AND** event handlers SHALL be registered from that namespace's router configuration

#### Scenario: Multiple namespace connections
- **WHEN** a client connects to multiple namespaces
- **THEN** each connection SHALL be handled independently
- **AND** middleware for each namespace SHALL execute separately
- **AND** event handlers for each namespace SHALL be independent

