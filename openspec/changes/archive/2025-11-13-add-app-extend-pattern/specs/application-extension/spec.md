# application-extension Specification

## Purpose
This specification defines the Application extension pattern for the `@eggjs/tegg-socket.io` plugin. It ensures that the plugin extends the Application object with `app.io` property using the traditional Egg.js extension pattern (`app/extend/application.ts`), matching the reference implementation behavior while maintaining TypeScript type safety.

## ADDED Requirements

### Requirement: Application Extension Pattern
The plugin SHALL extend the Application object with `app.io` property using the traditional Egg.js extension pattern.

#### Scenario: Extension file loading
- **WHEN** the plugin is loaded
- **THEN** the framework SHALL load `app/extend/application.ts` from the plugin
- **AND** the extension SHALL be merged into the Application prototype
- **AND** `app.io` SHALL be accessible as a getter property

#### Scenario: Lazy initialization in extension
- **WHEN** `app.io` is accessed
- **THEN** the Socket.IO server instance SHALL be created if it doesn't exist
- **AND** the server SHALL be configured with `serveClient(false)`
- **AND** `middleware` and `controller` objects SHALL be initialized as empty objects
- **AND** subsequent accesses SHALL return the same instance

#### Scenario: Extension timing
- **WHEN** the framework loads plugins
- **THEN** `app/extend/application.ts` SHALL be loaded during the extend phase
- **AND** the extension SHALL be available before `app.js`/`boot.ts` is loaded
- **AND** `app.io` SHALL be accessible in `boot.ts` lifecycle hooks

### Requirement: Extension Implementation
The extension SHALL match the reference implementation behavior.

#### Scenario: Getter implementation
- **WHEN** `app.io` getter is called
- **THEN** it SHALL use a Symbol for storage (`Symbol.for('EGG-SOCKET.IO#IO')`)
- **AND** it SHALL create a new Server instance if not exists
- **AND** it SHALL call `serveClient(false)` on the server
- **AND** it SHALL initialize `middleware` and `controller` properties
- **AND** it SHALL return the same instance on subsequent calls

#### Scenario: Type safety
- **WHEN** TypeScript compiles the extension
- **THEN** it SHALL have proper type definitions
- **AND** `app.io` SHALL be typed as `Server & { middleware: CustomMiddleware; controller: CustomController }`
- **AND** type definitions SHALL match those in `src/typings/index.d.ts`

### Requirement: Boot Hook Compatibility
The boot hook SHALL work correctly with the extension pattern.

#### Scenario: Boot hook access
- **WHEN** `boot.ts`'s `didLoad()` method executes
- **THEN** it SHALL be able to access `app.io`
- **AND** it SHALL be able to set `app.io.middleware` and `app.io.controller`
- **AND** middleware and controller loading SHALL work correctly

#### Scenario: Lifecycle initialization
- **WHEN** `boot.ts`'s `willReady()` method executes
- **THEN** it SHALL be able to access `app.io`
- **AND** namespace initialization SHALL work correctly
- **AND** Redis adapter setup SHALL work correctly
- **AND** server event listener registration SHALL work correctly

