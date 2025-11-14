# controller-system Specification

## MODIFIED Requirements

### Requirement: Event Routing
The plugin SHALL route Socket.IO events to controller methods via router configuration.

#### Scenario: Automatic route generation
- **WHEN** `autoRoute` is enabled in namespace configuration
- **THEN** routes SHALL be automatically registered for all loaded controller methods
- **AND** controller method names SHALL be used as Socket.IO event names
- **AND** routes SHALL be registered to the configured namespace
- **AND** auto-registered routes SHALL work identically to manually registered routes
- **AND** manual routes SHALL take precedence over auto-generated routes (no duplicates)

#### Scenario: Controller method name as event name
- **WHEN** a controller class has methods (e.g., `ping()`, `send()`, `disconnect()`)
- **THEN** auto-route generation SHALL use method names as event names
- **AND** routes SHALL be registered as `namespace.route('ping', controller.ping)`, `namespace.route('send', controller.send)`, etc.

#### Scenario: Object controller property names as event names
- **WHEN** a controller object has properties (e.g., `{ ping: function() {...}, send: function() {...} }`)
- **THEN** auto-route generation SHALL use property names as event names
- **AND** routes SHALL be registered for each property that is a function

#### Scenario: Function controller name as event name
- **WHEN** a controller exports a single function (e.g., `export default function ping() {...}`)
- **THEN** auto-route generation SHALL use the function name as the event name
- **AND** the route SHALL be registered for that event name

#### Scenario: Manual route precedence
- **WHEN** a route is manually registered in `app/router.ts` for an event name
- **THEN** auto-route generation SHALL skip that event name (no duplicate registration)
- **AND** the manual route SHALL work as configured
- **AND** no warning SHALL be logged (expected behavior)

#### Scenario: Auto-route configuration
- **WHEN** `autoRoute` is `true` in namespace configuration
- **THEN** auto-route generation SHALL be enabled for that namespace
- **AND** when `autoRoute` is `false` or omitted, auto-route generation SHALL be disabled
- **AND** auto-route generation SHALL only run for namespaces with `autoRoute: true`

#### Scenario: Auto-route registration timing
- **WHEN** controllers are loaded (in `didLoad` hook)
- **AND** `willReady` hook executes
- **THEN** auto-route generation SHALL run if `autoRoute` is enabled
- **AND** routes SHALL be registered before socket connections are established
- **AND** routes SHALL be available when the application becomes ready

