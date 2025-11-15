# middleware-system Specification

## Purpose
This specification defines the middleware system for the `@eggjs/tegg-socket.io` plugin, including connection middleware (executed on socket connect/disconnect) and packet middleware (executed on every Socket.IO event packet). It ensures middleware is properly loaded, composed, and executed in the correct order.
## Requirements
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

### Requirement: Connection Middleware
The plugin SHALL support connection middleware that executes on socket connection and disconnection.

#### Scenario: Connection middleware execution
- **WHEN** a socket connects to a namespace
- **THEN** all configured connection middleware for that namespace SHALL execute in order
- **AND** middleware SHALL receive Egg.js Context with `socket` property
- **AND** middleware SHALL be able to call `await next()` to continue
- **AND** middleware SHALL be able to disconnect the socket or prevent connection

#### Scenario: Connection middleware configuration
- **WHEN** a namespace is configured with `connectionMiddleware` array
- **THEN** each middleware name in the array SHALL be resolved from `app.io.middleware`
- **AND** an error SHALL be thrown if middleware is not found
- **AND** middleware SHALL be composed into a single middleware chain

#### Scenario: Session middleware injection
- **WHEN** session middleware is available in `app.middleware`
- **THEN** it SHALL be automatically prepended to connection middleware chain
- **AND** it SHALL execute before other connection middleware

#### Scenario: Connection disconnection handling
- **WHEN** a socket disconnects
- **THEN** connection middleware code after `await next()` SHALL execute
- **AND** cleanup logic in middleware SHALL run

### Requirement: Packet Middleware
The plugin SHALL support packet middleware that executes on every Socket.IO event packet.

#### Scenario: Packet middleware execution
- **WHEN** a socket emits an event (except system events)
- **THEN** all configured packet middleware for that namespace SHALL execute in order
- **AND** middleware SHALL receive Egg.js Context with `socket`, `packet`, and `args` properties
- **AND** middleware SHALL be able to call `await next()` to continue
- **AND** middleware SHALL be able to modify or filter packets

#### Scenario: Packet middleware configuration
- **WHEN** a namespace is configured with `packetMiddleware` array
- **THEN** each middleware name in the array SHALL be resolved from `app.io.middleware`
- **AND** an error SHALL be thrown if middleware is not found
- **AND** middleware SHALL be composed into a single middleware chain

#### Scenario: Session middleware injection in packets
- **WHEN** session middleware is available in `app.middleware`
- **THEN** it SHALL be automatically prepended to packet middleware chain
- **AND** it SHALL execute before other packet middleware

#### Scenario: Packet middleware context event
- **WHEN** packet middleware completes execution
- **THEN** a context event SHALL be emitted to signal completion
- **AND** event handlers SHALL be able to listen for this event

### Requirement: Middleware Composition
The plugin SHALL use koa-compose to chain middleware together.

#### Scenario: Middleware chaining
- **WHEN** multiple middleware are configured
- **THEN** they SHALL be composed using koa-compose
- **AND** they SHALL execute in the order specified in configuration
- **AND** errors in middleware SHALL be properly handled

