## MODIFIED Requirements

### Requirement: Lifecycle Integration
The plugin SHALL integrate with Egg.js application lifecycle hooks using `ILifecycleBoot` interface.

#### Scenario: Boot hook class implementation
- **WHEN** the plugin is loaded
- **THEN** it SHALL export a class implementing `ILifecycleBoot` interface
- **AND** the class SHALL have a constructor accepting `app: EggCore` parameter
- **AND** the class SHALL implement lifecycle methods: `configDidLoad()`, `didLoad()`, `willReady()`, and `serverDidReady()`

#### Scenario: Config did load hook
- **WHEN** `configDidLoad()` lifecycle method is called
- **THEN** the `app.io` extension SHALL be defined using `Reflect.defineProperty`
- **AND** the extension SHALL support lazy initialization
- **AND** the extension SHALL be available before other initialization

#### Scenario: Did load hook
- **WHEN** `didLoad()` lifecycle method is called
- **THEN** controllers and middleware SHALL be loaded from `app/io/controller/` and `app/io/middleware/` directories
- **AND** loaded controllers and middleware SHALL be accessible via `app.io.controller` and `app.io.middleware`
- **AND** loading SHALL happen after `app.io` extension is defined

#### Scenario: Will ready hook
- **WHEN** `willReady()` lifecycle method is called
- **THEN** all configured namespaces SHALL be initialized
- **AND** connection and packet middleware SHALL be composed and registered
- **AND** event handlers SHALL be registered for each namespace
- **AND** Redis adapter SHALL be set up if configured
- **AND** `app.on('server')` event listener SHALL be registered

#### Scenario: Server did ready hook
- **WHEN** `serverDidReady()` lifecycle method is called
- **THEN** Socket.IO server SHALL be attached to HTTP server (if not already attached)
- **AND** this SHALL happen after HTTP server is ready
- **AND** `init` configuration options SHALL be passed to engine.io
- **AND** custom `generateId` function SHALL be registered if configured

#### Scenario: Server event listener registration
- **WHEN** `app.on('server')` event listener is registered
- **THEN** it SHALL be registered in `willReady()` method
- **AND** it SHALL attach Socket.IO server when HTTP server becomes available
- **AND** it SHALL pass `init` configuration options to engine.io
- **AND** it SHALL register custom `generateId` function if configured

