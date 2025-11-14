## MODIFIED Requirements

### Requirement: Application Extension
The plugin SHALL extend Application with `app.io` property using modern pattern in `configDidLoad()` lifecycle hook.

#### Scenario: Extension definition timing
- **WHEN** `configDidLoad()` lifecycle method is called
- **THEN** the `app.io` extension SHALL be defined using `Reflect.defineProperty`
- **AND** it SHALL be defined after configuration is loaded
- **AND** it SHALL be available before other initialization methods

#### Scenario: Extension property definition
- **WHEN** `app.io` extension is defined
- **THEN** it SHALL use `Reflect.defineProperty` method (modern pattern)
- **AND** it SHALL define a getter property
- **AND** it SHALL support lazy initialization
- **AND** it SHALL use a Symbol for internal storage (SocketIOSymbol)
- **AND** it SHALL be configurable

#### Scenario: Lazy initialization
- **WHEN** `app.io` is accessed for the first time
- **THEN** a Socket.IO server instance SHALL be created if it doesn't exist
- **AND** the server SHALL be configured with `serveClient(false)` by default
- **AND** controller and middleware objects SHALL be initialized
- **AND** subsequent accesses SHALL return the same instance

#### Scenario: Extension availability
- **WHEN** `app.io` extension is defined in `configDidLoad()`
- **THEN** it SHALL be available in subsequent lifecycle methods
- **AND** it SHALL be available in `didLoad()` for loading controllers/middleware
- **AND** it SHALL be available in `willReady()` for namespace initialization
- **AND** it SHALL be available throughout the application lifecycle

#### Scenario: Type definitions
- **WHEN** TypeScript type definitions are checked
- **THEN** `app.io` SHALL be properly typed in Application interface
- **AND** it SHALL have type `Server & { middleware: LoadedMiddleware, controller: LoadedController }`
- **AND** type definitions SHALL be available in `typings/index.d.ts`
- **AND** type definitions SHALL extend Egg.js Application interface

