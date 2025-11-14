# Design: Add Auto Route Generation for Socket.IO Controllers

## Context

Currently, Socket.IO controllers are loaded automatically via FileLoader, but routes must be manually registered in `app/router.ts`. This proposal adds automatic route generation based on conventions.

## Goals / Non-Goals

### Goals

- Automatically register routes for loaded controllers based on file names and method names
- Use controller method names as event names by default
- Support both auto-generated and manual routes (manual takes precedence)
- Support namespace configuration for auto-routes
- Make it opt-in via configuration (backward compatible)
- Support all controller export formats (class, object, function)

### Non-Goals

- Removing manual route registration (manual routes should still work)
- Changing existing route registration API
- Auto-generating namespaces based on controller location
- Complex route naming conventions (keep it simple)

## Decisions

### Decision 1: Convention-Based Event Naming

**What**: Use controller method names as Socket.IO event names

**Why**:
- Simple and intuitive
- Matches common patterns (method name = event name)
- Easy to understand and use
- Consistent with many WebSocket frameworks

**Implementation**:
- For class controllers: use method names as event names
- For object controllers: use object property names as event names
- For function controllers: use function name as event name
- Controller file name is not used in event name (methods are sufficient)

**Example**:
```typescript
// app/io/controller/chat.ts
export default (app: Application) => {
  class ChatController extends app.Controller {
    ping() { ... }      // Auto-registered as event 'ping'
    send() { ... }      // Auto-registered as event 'send'
    disconnect() { ... } // Auto-registered as event 'disconnect'
  }
  return ChatController;
};
```

### Decision 2: Configuration Option

**What**: Add `autoRoute` option to enable/disable auto route generation

**Why**:
- Backward compatible (opt-in)
- Allows users to choose between auto and manual routing
- Can be enabled per namespace if needed

**Implementation**:
```typescript
// config/config.default.ts
export default () => ({
  teggSocketIO: {
    namespace: {
      '/': {
        autoRoute: true,  // Enable auto route generation
        connectionMiddleware: [],
        packetMiddleware: [],
      },
    },
  },
});
```

### Decision 3: Route Registration Timing

**What**: Register auto-routes after controllers are loaded but before application is ready

**Why**:
- Controllers must be loaded first
- Routes should be registered before socket connections are established
- Should happen in `willReady` hook after `didLoad` (where controllers are loaded)

**Implementation**:
- Add auto-route registration in `willReady` hook in `src/boot.ts`
- Iterate through loaded controllers and register routes based on methods
- Only register if `autoRoute` is enabled for the namespace

### Decision 4: Manual Routes Take Precedence

**What**: If a route is manually registered, skip auto-registration for that event

**Why**:
- Allows users to override auto-generated routes
- Prevents conflicts between manual and auto routes
- Flexible for custom event names

**Implementation**:
- Check if route already exists before auto-registering
- Skip auto-registration if manual route exists
- Log warning if both manual and auto routes exist (development only)

### Decision 5: Namespace Mapping

**What**: Auto-register routes to the default namespace (`/`) or configured namespaces

**Why**:
- Most controllers are for the default namespace
- Support per-namespace configuration
- Keep it simple - one controller can serve multiple namespaces via manual routes

**Implementation**:
- Default: register to default namespace (`/`)
- If multiple namespaces configured, user must manually register or we register to all configured namespaces
- Keep it simple: auto-route to default namespace only, use manual routes for custom namespaces

## Risks / Trade-offs

### Risk 1: Event Name Conflicts

**Risk**: Multiple controllers with same method names might conflict

**Mitigation**:
- Use controller file name as prefix if needed: `chat.ping`, `user.ping`
- Or use full controller name: `${controllerName}.${methodName}`
- Document best practices (unique method names per namespace)
- Start simple: use method name only, add prefix if conflicts occur

### Risk 2: Too Much Magic

**Risk**: Auto-routing might be confusing or unexpected

**Mitigation**:
- Make it opt-in via configuration
- Clear documentation
- Log auto-registered routes in debug mode
- Keep manual routes as primary method for complex cases

### Risk 3: Performance Impact

**Risk**: Auto-registration might slow down application startup

**Mitigation**:
- Route registration is fast (just adding to a Map)
- Only runs once at startup
- Can be disabled if performance is a concern
- Minimal overhead compared to controller loading

### Risk 4: Controller Discovery

**Risk**: Detecting controller methods might be complex (class vs object vs function)

**Mitigation**:
- Use TypeScript metadata or reflection if available
- Fall back to simple property enumeration
- Test with all controller export formats
- Document limitations

## Implementation Plan

### Phase 1: Core Auto-Route Logic
- Add `autoRoute` configuration option
- Implement route auto-registration function
- Support class controllers (enumerate methods)
- Support object controllers (enumerate properties)
- Support function controllers (use function name)

### Phase 2: Integration
- Integrate auto-route registration into `willReady` hook
- Check for existing routes before auto-registering
- Add debug logging

### Phase 3: Testing and Documentation
- Add tests for auto-route generation
- Update documentation with examples
- Add configuration examples

