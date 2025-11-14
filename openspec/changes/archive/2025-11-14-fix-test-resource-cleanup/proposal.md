# Change: Fix Test Resource Cleanup

## Why

Current tests have resource cleanup issues that cause memory leaks and resource exhaustion:

1. **Cluster Applications Not Closed** - Tests using `mm.cluster()` may not properly close when tests timeout or fail, leaving cluster processes and workers running
2. **Socket.IO Connections Not Disconnected** - Socket.IO client connections may remain open after test completion, especially in error cases
3. **No Global Cleanup** - Missing global cleanup hooks to ensure all resources are released even when tests fail or timeout
4. **Timeout Handling** - Tests that timeout don't trigger cleanup, leaving resources orphaned

This causes:
- Multiple Node.js processes accumulating over time
- High memory usage (observed hundreds of MB per process)
- Resource leaks that make the system unstable
- Difficulty running tests multiple times without manual cleanup

## What Changes

This proposal fixes test resource cleanup to ensure all resources are properly released:

1. **Add Global Cleanup Hooks** - Add `after` hooks to ensure all application instances and Socket.IO connections are closed
2. **Improve Timeout Handling** - Add timeout handlers and ensure cleanup happens on timeout
3. **Fix Socket.IO Connection Cleanup** - Ensure all Socket.IO client connections are properly disconnected
4. **Add Error Handling** - Ensure cleanup happens even when tests fail or error
5. **Track Application Instances** - Track all created application instances and ensure they're closed
6. **Add Timeout Configuration** - Configure appropriate test timeouts and ensure cleanup on timeout

## Impact

- **Affected specs**: 
  - May need to update `testing` spec (when it exists) to require proper resource cleanup
- **Affected code**: 
  - `test/socket.io.test.ts` - Add cleanup hooks and resource tracking
  - Test helper functions may need updates
- **Breaking changes**: None - this is a test-only change
- **Migration path**: No migration needed - existing tests will continue to work, just with better cleanup

## References

- **Reference implementation**: `refers/egg-socket.io-master/test/io.test.js` - Reference test cleanup patterns
- **Test framework**: `@eggjs/mock` - Mock framework documentation for proper cleanup
- **Socket.IO client**: `socket.io-client` - Client cleanup methods

