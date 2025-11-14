# Design: Fix Test Resource Cleanup

## Context

Current tests create Socket.IO server instances via `mm.cluster()` and `mm.app()`, and Socket.IO client connections. When tests timeout or fail, these resources are not properly cleaned up, leading to resource leaks and memory exhaustion.

## Goals / Non-Goals

### Goals

- Ensure all `mm.cluster()` and `mm.app()` instances are closed after tests
- Ensure all Socket.IO client connections are disconnected
- Handle cleanup in all scenarios: success, failure, timeout
- Add global cleanup hooks to catch any missed resources
- Improve test reliability and prevent resource leaks

### Non-Goals

- Changing test logic or behavior (only cleanup improvements)
- Changing test framework or structure
- Optimizing test performance (focus is on cleanup, not speed)

## Decisions

### Decision 1: Track Application Instances

**What**: Track all created application instances in a global array

**Why**:
- Allows cleanup of all instances in `after` hooks
- Ensures no instances are missed, even if test fails
- Simple and effective pattern

**Implementation**:
- Create array to track app instances: `const apps: MockApplication[] = []`
- Push each created instance to the array
- Close all instances in `after` hook

### Decision 2: Track Socket.IO Client Connections

**What**: Track all Socket.IO client connections and ensure they're disconnected

**Why**:
- Socket.IO connections may not be automatically closed
- Prevents connection leaks
- Ensures clean state between tests

**Implementation**:
- Create array to track client connections: `const sockets: ReturnType<typeof ioClient>[] = []`
- Push each created connection to the array
- Disconnect all connections in `after` hook

### Decision 3: Add Global Cleanup Hooks

**What**: Add `after` hooks at the top level to ensure cleanup

**Why**:
- Catches all resources, even if test fails or times out
- Provides safety net for any missed cleanup
- Ensures clean state after test suite

**Implementation**:
```typescript
after(() => {
  // Close all Socket.IO client connections
  sockets.forEach(socket => {
    if (socket.connected) {
      socket.disconnect();
    }
  });
  sockets.length = 0;
  
  // Close all application instances
  return Promise.all(apps.map(app => app.close().catch(() => {})));
});
```

### Decision 4: Add Timeout Handlers

**What**: Add timeout handling to ensure cleanup happens on timeout

**Why**:
- Tests that timeout currently leave resources open
- Need explicit cleanup in timeout scenarios
- Prevent resource leaks from timed-out tests

**Implementation**:
- Set appropriate test timeout (e.g., 30 seconds)
- Use `beforeEach` or test setup to track timeouts
- Ensure cleanup happens in timeout handler

### Decision 5: Improve Error Handling in Tests

**What**: Wrap test logic in try-catch-finally to ensure cleanup

**Why**:
- Tests that throw errors may not trigger cleanup
- Need to ensure cleanup happens in all error paths
- Improve test reliability

**Implementation**:
- Use try-catch-finally in callback-based tests where appropriate
- Ensure `app.close()` is called in finally block
- Ensure socket disconnection happens in finally block

## Risks / Trade-offs

### Risk 1: Cleanup Overhead

**Risk**: Adding cleanup may slow down tests slightly

**Mitigation**:
- Cleanup is minimal overhead
- Benefits of preventing resource leaks far outweigh minor slowdown
- Cleanup is async and non-blocking

### Risk 2: Cleanup Failures

**Risk**: Cleanup itself may fail and cause issues

**Mitigation**:
- Wrap cleanup in try-catch
- Use `.catch(() => {})` to ignore cleanup errors
- Log warnings but don't fail tests on cleanup errors

### Risk 3: Test Timeout Interference

**Risk**: Adding cleanup may interfere with test timeouts

**Mitigation**:
- Ensure cleanup is fast and non-blocking
- Use appropriate timeout values
- Test timeout handlers should trigger cleanup

## Implementation Plan

### Phase 1: Add Resource Tracking
- Add arrays to track app instances and Socket.IO connections
- Modify test code to track resources

### Phase 2: Add Global Cleanup Hooks
- Add `after` hook to close all tracked resources
- Ensure cleanup happens even if tests fail

### Phase 3: Improve Individual Test Cleanup
- Add cleanup to each test's error paths
- Ensure cleanup in timeout scenarios

### Phase 4: Testing and Validation
- Run test suite multiple times to verify no resource leaks
- Check for orphaned processes
- Verify memory usage doesn't grow

