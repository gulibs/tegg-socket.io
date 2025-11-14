# testing Specification

## Purpose
This specification defines the testing requirements for the `@eggjs/tegg-socket.io` plugin. It ensures that all test resources are properly cleaned up to prevent memory leaks and resource exhaustion, including application instances created via `mm.cluster()` and `mm.app()`, and Socket.IO client connections.
## Requirements
### Requirement: Test Resource Cleanup
The plugin SHALL properly clean up all test resources to prevent memory leaks and resource exhaustion.

#### Scenario: Application instance cleanup
- **WHEN** tests create application instances using `mm.cluster()` or `mm.app()`
- **THEN** all application instances SHALL be closed after tests complete
- **AND** cleanup SHALL happen even if tests fail or timeout
- **AND** cleanup SHALL happen in both success and error scenarios
- **AND** global cleanup hooks SHALL ensure no application instances remain open

#### Scenario: Socket.IO connection cleanup
- **WHEN** tests create Socket.IO client connections
- **THEN** all Socket.IO client connections SHALL be disconnected after tests complete
- **AND** cleanup SHALL happen even if tests fail or timeout
- **AND** cleanup SHALL happen in both success and error scenarios
- **AND** global cleanup hooks SHALL ensure no Socket.IO connections remain open

#### Scenario: Test timeout cleanup
- **WHEN** tests timeout
- **THEN** all resources SHALL be cleaned up in timeout handlers
- **AND** application instances SHALL be closed on timeout
- **AND** Socket.IO connections SHALL be disconnected on timeout
- **AND** cleanup SHALL prevent resource leaks from timed-out tests

#### Scenario: Test failure cleanup
- **WHEN** tests fail or error
- **THEN** all resources SHALL be cleaned up in error handlers
- **AND** application instances SHALL be closed on failure
- **AND** Socket.IO connections SHALL be disconnected on failure
- **AND** cleanup SHALL prevent resource leaks from failed tests

#### Scenario: Global cleanup hooks
- **WHEN** test suite completes
- **THEN** global `after` hooks SHALL close all tracked application instances
- **AND** global `after` hooks SHALL disconnect all tracked Socket.IO connections
- **AND** cleanup SHALL handle errors gracefully (catch cleanup errors, don't fail tests)
- **AND** cleanup SHALL ensure no orphaned processes remain after test suite

