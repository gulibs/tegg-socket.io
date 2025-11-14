# controller-system Specification

## Purpose
This specification defines the controller system for the `@eggjs/tegg-socket.io` plugin, including event-based controller loading and routing. It ensures that Socket.IO events are properly routed to controller methods with access to Egg.js context and Socket.IO socket instances.
## Requirements
### Requirement: Controller Loading
The plugin SHALL load controllers from `app/io/controller/` directories across all load units using FileLoader pattern.

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

### Requirement: Event Routing
The plugin SHALL route Socket.IO events to controller methods via router configuration.

#### Scenario: Event handler registration
- **WHEN** a namespace router configures an event route (e.g., `io.of('/').route('event', controller.method)`)
- **THEN** the event SHALL be registered in the namespace router configuration
- **AND** when a client emits that event, the controller method SHALL be called

#### Scenario: Controller method execution
- **WHEN** a socket emits an event that has a registered route
- **THEN** the corresponding controller method SHALL be called
- **AND** the method SHALL receive Egg.js Context with `socket` and `args` properties
- **AND** the method SHALL be able to access `ctx.socket` for emitting responses
- **AND** the method SHALL be able to access `ctx.args` for event arguments

#### Scenario: Controller context access
- **WHEN** a controller method executes
- **THEN** it SHALL have access to `ctx` (Context), `app`, `service`, `config`, `logger`
- **AND** it SHALL inherit from `egg.Controller` capabilities
- **AND** it SHALL be able to emit events via `ctx.socket.emit()`

#### Scenario: Async controller methods
- **WHEN** a controller method returns a Promise
- **THEN** the Promise SHALL be properly awaited
- **AND** errors SHALL be caught and logged
- **AND** context completion event SHALL be emitted after resolution

### Requirement: System Event Handling
The plugin SHALL handle Socket.IO system events (`disconnect`, `error`, `disconnecting`) specially.

#### Scenario: System event execution
- **WHEN** a system event (`disconnect`, `error`, `disconnecting`) is configured
- **THEN** it SHALL be handled differently from regular events
- **AND** the controller method SHALL receive event arguments in `ctx.args`
- **AND** packet middleware SHALL NOT execute for system events
- **AND** errors in system event handlers SHALL be caught and logged

#### Scenario: Error event handling
- **WHEN** an error event occurs
- **THEN** the error SHALL be logged with `[egg-socket.io] controller execute error:` prefix
- **AND** the application SHALL continue running (not crash)

#### Scenario: Disconnect event handling
- **WHEN** a disconnect event occurs
- **THEN** the disconnect handler SHALL execute
- **AND** cleanup logic in controllers SHALL run

### Requirement: Event Context Completion
The plugin SHALL signal when event handling completes.

#### Scenario: Context completion event
- **WHEN** a regular event handler completes (not system events)
- **THEN** a context completion event SHALL be emitted
- **AND** the event SHALL be emitted on the context's internal event emitter
- **AND** listeners SHALL be able to react to completion

#### Scenario: Error in event handling
- **WHEN** an error occurs during event handling
- **THEN** the error SHALL be caught
- **AND** the completion event SHALL be emitted with the error
- **AND** the error SHALL be logged appropriately

