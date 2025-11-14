# Design: Modernize Socket.IO Plugin

## Context

The Socket.IO plugin for Egg.js/Tegg framework provides real-time WebSocket communication capabilities. This design document outlines the architecture and patterns for modernizing the plugin based on three reference implementations:

1. **@eggjs/mysql (mysql-master)** - Latest modern plugin standard
2. **egg-socket.io-master** - Original implementation (legacy, to be replaced)
3. **@gulibs/tegg-wss** - Modern WebSocket plugin showing middleware patterns

## Goals / Non-Goals

### Goals

- Establish comprehensive specifications for all plugin capabilities
- Align plugin structure with modern Tegg patterns (agent.ts, app.ts, boot.ts)
- Maintain 100% feature parity with egg-socket.io-master
- Ensure type safety with comprehensive TypeScript definitions
- Support modern development workflows (ES modules, dual ESM/CJS builds)

### Non-Goals

- Breaking existing API compatibility (unless necessary for security/modernization)
- Rewriting from scratch (this is a modernization, not a rewrite)
- Adding new features beyond what was in egg-socket.io-master
- Supporting legacy Node.js versions (<18.19.0)

## Decisions

### Decision 1: Plugin Structure Pattern

**What**: Use the `agent.ts`/`app.ts`/`boot.ts` pattern from @eggjs/mysql

**Why**: 
- Consistent with modern Tegg plugins
- Clear separation of concerns
- Proper lifecycle hook integration via `ILifecycleBoot`
- Better TypeScript support

**Alternatives considered**:
- Keep current single-file initialization (app.js/io.ts)
  - **Rejected**: Doesn't follow modern patterns, harder to test lifecycle hooks
- Use class-based approach like tegg-wss
  - **Rejected**: Overkill for Socket.IO integration, less aligned with Tegg patterns

**Implementation**:
```
src/
├── index.ts           # Import types/config
├── agent.ts           # Export boot hook for agent
├── app.ts             # Export boot hook for app
├── boot.ts            # ILifecycleBoot implementation
├── config/
│   └── config.default.ts
└── lib/               # Core implementation (existing)
```

### Decision 2: FileLoader for Controllers and Middleware

**What**: Continue using FileLoader pattern (already implemented, matching tegg-wss)

**Why**:
- Works well with multi-load-unit support
- Consistent with tegg-wss approach
- More flexible than `loadController()` method
- Supports both function and class-based exports

**Alternatives considered**:
- Use `app.loader.loadController()` like egg-socket.io-master
  - **Rejected**: Designed for `app/controller`, not `app/io/controller`, less flexible

**Implementation**: Already correct in current `loader.ts`

### Decision 3: Middleware Composition

**What**: Use koa-compose for middleware chaining (already implemented)

**Why**:
- Standard Koa pattern
- Works with async/await
- Supports both connection and packet middleware
- Compatible with Egg.js context

**Implementation**: Already correct, uses `compose()` from `koa-compose`

### Decision 4: Configuration Structure

**What**: Maintain `config.teggSocketIO` structure (not `config.io`)

**Why**:
- Plugin name is `teggSocketIO`, not `io`
- Avoids conflicts with other plugins
- Clear namespace

**Type safety**: Use TypeScript config interface with proper typing

### Decision 5: Redis Adapter Loading

**What**: Load socket.io-redis dynamically when configured

**Why**:
- Optional dependency (only needed for cluster mode)
- Reduces bundle size for single-process deployments
- Matches original implementation pattern

**Implementation**: Use `require()` in `beforeStart` hook (already correct)

## Risks / Trade-offs

### Risk 1: Lifecycle Hook Timing

**Risk**: Socket.IO initialization might need to happen at specific lifecycle stages

**Mitigation**: 
- Use `configDidLoad()` for setup, `beforeStart()` for namespace initialization
- Ensure HTTP server attachment happens in `server` event handler
- Test thoroughly with multi-process mode

### Risk 2: Type Definition Complexity

**Risk**: Socket.IO types combined with Egg.js context types can be complex

**Mitigation**:
- Extend existing Egg.js Context types carefully
- Use intersection types for SocketIOContext
- Provide comprehensive examples in typings

### Risk 3: Backward Compatibility

**Risk**: Changes might break existing applications

**Mitigation**:
- Maintain same configuration structure
- Keep same middleware/controller loading patterns
- Ensure all tests from egg-socket.io-master pass
- Document any necessary migration steps

## Migration Plan

### Phase 1: Specification (Current)
- Create comprehensive specs for all capabilities
- Document current implementation against specs
- Identify any gaps or deviations

### Phase 2: Structure Alignment
- Refactor to agent.ts/app.ts/boot.ts pattern if needed
- Ensure proper lifecycle hook usage
- Update type definitions

### Phase 3: Testing and Validation
- Ensure all egg-socket.io-master test scenarios pass
- Add additional tests for modern patterns
- Validate with real-world applications

### Phase 4: Documentation
- Update README with modern patterns
- Document migration from egg-socket.io
- Add TypeScript usage examples

## Open Questions

1. Should we add agent support? (Socket.IO typically only needs app-level)
   - **Decision**: No, Socket.IO is app-level only (answer in implementation)
   
2. Should we use oxlint instead of eslint?
   - **Decision**: Evaluate based on mysql-master preference (use oxlint if aligned)

3. Do we need explicit type exports in package.json?
   - **Decision**: Yes, follow mysql-master pattern for dual build support

