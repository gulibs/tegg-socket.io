# Design: Refactor to Boot Hook Pattern

## Context

The Socket.IO plugin currently uses a function-based initialization pattern where `app.ts` exports a function that sets up Socket.IO when called. Modern Egg.js/Tegg plugins use the `ILifecycleBoot` interface with a boot hook class that provides better lifecycle management and clearer separation of concerns.

## Goals / Non-Goals

### Goals

- Refactor to use `ILifecycleBoot` interface (boot hook pattern)
- Implement `app.io` extension using modern pattern (Reflect.defineProperty in configDidLoad)
- Use proper lifecycle hooks instead of `beforeStart` and event listeners
- Maintain 100% backward compatibility (same API, same behavior)
- Follow mysql-master pattern for consistency

### Non-Goals

- Changing the public API
- Changing configuration structure
- Adding new features
- Breaking existing functionality

## Decisions

### Decision 1: Boot Hook Class Structure

**What**: Create `SocketIOBootHook` class implementing `ILifecycleBoot` interface

**Why**:
- Consistent with modern Tegg plugins (mysql-master pattern)
- Better lifecycle management with explicit hooks
- Easier to test and maintain
- Clearer separation of initialization concerns

**Implementation**:
```typescript
// src/boot.ts
export class SocketIOBootHook implements ILifecycleBoot {
  private readonly app: EggCore;
  constructor(app: EggCore) {
    this.app = app;
  }

  configDidLoad() {
    // Define app.io extension
  }

  async didLoad() {
    // Load controllers and middleware
  }

  async willReady() {
    // Initialize namespaces
  }

  async serverDidReady() {
    // Attach to HTTP server (or use app.on('server'))
  }
}
```

### Decision 2: Application Extension Timing

**What**: Define `app.io` extension in `configDidLoad()` using `Reflect.defineProperty`

**Why**:
- `configDidLoad()` is called after config is loaded but before other initialization
- Allows `app.io` to be available early in the lifecycle
- Matches mysql-master pattern (uses `Reflect.defineProperty` in `configDidLoad`)
- Better than `app/extend/application.js` which is legacy pattern

**Alternatives considered**:
- Keep `Object.defineProperty` in initialization function
  - **Rejected**: Doesn't follow modern pattern, harder to test lifecycle
- Use `app/extend/application.js` like egg-socket.io-master
  - **Rejected**: Legacy pattern, not used in modern plugins

### Decision 3: Lifecycle Method Mapping

**What**: Map current initialization logic to proper lifecycle hooks

**Why**:
- `configDidLoad()` - Config is loaded, safe to define extensions
- `didLoad()` - All files loaded, safe to load controllers/middleware
- `willReady()` - Plugins started, safe to initialize namespaces
- `serverDidReady()` or `app.on('server')` - HTTP server ready, safe to attach Socket.IO

**Mapping**:
- Current: `Object.defineProperty(app, 'io', ...)` → `configDidLoad()` with `Reflect.defineProperty`
- Current: `loadControllersAndMiddleware(app)` → `didLoad()`
- Current: `app.beforeStart()` namespace init → `willReady()`
- Current: `app.on('server')` attachment → `serverDidReady()` or keep `app.on('server')`

### Decision 4: Server Event Handling

**What**: Use `app.on('server')` event listener (keep current approach)

**Why**:
- Socket.IO needs to attach when HTTP server is ready
- `serverDidReady()` might be too late (after server starts listening)
- `app.on('server')` is the correct event for this use case
- Can register listener in `willReady()` before server is ready

**Alternatives considered**:
- Use `serverDidReady()` lifecycle method
  - **Rejected**: Might be too late, server already listening
- Use `didReady()` lifecycle method
  - **Rejected**: Too early, server not yet created

### Decision 5: Agent Support

**What**: No agent support (Socket.IO is app-level only)

**Why**:
- Socket.IO servers only run in application workers, not agent
- No need for agent.ts (only app.ts needed)
- Matches current implementation

**Implementation**: Only `app.ts` exports boot hook, no `agent.ts`

## Risks / Trade-offs

### Risk 1: Lifecycle Timing

**Risk**: Changing lifecycle hooks might affect initialization order

**Mitigation**: 
- Test thoroughly with existing test cases
- Ensure `app.io` is available at same point in lifecycle
- Verify namespace initialization happens at correct time
- Test with cluster mode and Redis adapter

### Risk 2: Server Event Registration

**Risk**: Registering `app.on('server')` in wrong lifecycle hook might miss the event

**Mitigation**:
- Register in `willReady()` before server is created
- Test that Socket.IO attaches correctly
- Verify with multiple HTTP servers if needed

### Risk 3: Backward Compatibility

**Risk**: Refactoring might change behavior subtly

**Mitigation**:
- Maintain exact same API
- Keep same initialization order
- Test all existing test cases pass
- Ensure no breaking changes

## Migration Plan

### Phase 1: Create Boot Hook Structure
- Create `boot.ts` with `SocketIOBootHook` class
- Implement `ILifecycleBoot` interface
- Move initialization logic to appropriate lifecycle methods

### Phase 2: Update app.ts
- Change `app.ts` to export boot hook class
- Remove function-based initialization

### Phase 3: Refactor Initialization Logic
- Move `app.io` extension to `configDidLoad()`
- Move controller/middleware loading to `didLoad()`
- Move namespace initialization to `willReady()`
- Keep server attachment in `app.on('server')` (register in `willReady()`)

### Phase 4: Testing
- Ensure all existing tests pass
- Test lifecycle hooks are called in correct order
- Verify `app.io` is available at expected times
- Test with cluster mode and Redis adapter

## Open Questions

1. Should we use `serverDidReady()` instead of `app.on('server')`?
   - **Decision**: No, `app.on('server')` is more appropriate for Socket.IO attachment
   
2. Should we support agent-level Socket.IO?
   - **Decision**: No, Socket.IO is app-level only (answer in implementation)

