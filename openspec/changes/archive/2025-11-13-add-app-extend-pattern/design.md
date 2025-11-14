# Design: Add Application Extension Pattern Support

## Context

The Socket.IO plugin currently uses the modern Tegg pattern with `Reflect.defineProperty` in `boot.ts` to extend the Application object. The reference implementation (`egg-socket.io-master`) uses the traditional Egg.js plugin pattern with `app/extend/application.js`.

## Goals / Non-Goals

### Goals

- Add support for traditional `app/extend/application.js` pattern
- Match reference implementation behavior exactly
- Maintain TypeScript type safety
- Preserve lazy initialization behavior
- Keep middleware and controller initialization

### Non-Goals

- Breaking existing API compatibility
- Removing modern pattern support (can coexist)
- Changing Socket.IO server initialization logic
- Modifying middleware/controller loading logic

## Decisions

### Decision 1: Use Traditional Extension Pattern

**What**: Use `app/extend/application.ts` instead of `Reflect.defineProperty` in `boot.ts`

**Why**: 
- Matches reference implementation exactly
- Uses framework's built-in extension loading mechanism
- Aligns with Egg.js plugin conventions
- Loaded at the correct lifecycle stage (extend phase)

**Alternatives considered**:
- Keep both patterns (app/extend and boot.ts)
  - **Rejected**: Could cause conflicts or confusion
- Keep only boot.ts pattern
  - **Rejected**: Doesn't match reference implementation

**Implementation**:
```typescript
// src/app/extend/application.ts
import { Server } from '../lib/socket.io/index.js';
import type { LoadedMiddleware, LoadedController } from '../lib/types.js';
import debug from 'debug';

const debugLog = debug('egg-socket.io:app:extend:application');
const SocketIOSymbol = Symbol.for('EGG-SOCKET.IO#IO');

export default {
  get io(): Server & { middleware: LoadedMiddleware; controller: LoadedController } {
    if (!this[SocketIOSymbol]) {
      debugLog('[egg-socket.io] create SocketIO instance!');
      this[SocketIOSymbol] = new Server() as Server & { middleware: LoadedMiddleware; controller: LoadedController };
      this[SocketIOSymbol].serveClient(false);
      // Initialize controller and middleware objects
      this[SocketIOSymbol].controller = {} as LoadedController;
      this[SocketIOSymbol].middleware = {} as LoadedMiddleware;
    }
    return this[SocketIOSymbol];
  },
};
```

### Decision 2: Remove Extension from Boot Hook

**What**: Remove `app.io` extension from `boot.ts`'s `configDidLoad()` method

**Why**:
- Extension should be defined in `app/extend/application.ts`
- Boot hook should focus on lifecycle initialization
- Avoids duplicate extension definitions
- Matches reference implementation pattern

**Implementation**: Remove the `Reflect.defineProperty` call from `boot.ts`

### Decision 3: Maintain TypeScript Support

**What**: Use TypeScript for `app/extend/application.ts` with proper type definitions

**Why**:
- Maintains type safety
- Provides better IDE support
- Aligns with project conventions
- Framework supports TypeScript extensions

**Implementation**: 
- Use `.ts` extension (framework will compile/load correctly)
- Maintain type definitions in `src/typings/index.d.ts`
- Use proper TypeScript types for Application extension

### Decision 4: Keep Middleware and Controller Initialization

**What**: Initialize `middleware` and `controller` objects in extension (not in reference)

**Why**:
- Required for FileLoader pattern to work
- Maintains compatibility with current implementation
- Doesn't break existing functionality
- Reference implementation may not need this (different loading pattern)

**Implementation**: Initialize empty objects in extension getter

## Risks / Trade-offs

### Risk 1: Extension Loading Order

**Risk**: `app/extend/application.ts` is loaded before `boot.ts`, but middleware/controller loading happens in `boot.ts`

**Mitigation**: 
- Extension only defines the getter
- Actual loading happens in `boot.ts`'s `didLoad()` method
- Extension ensures `app.io.middleware` and `app.io.controller` exist before loading

### Risk 2: Type Definition Conflicts

**Risk**: Type definitions might conflict between extension and boot hook

**Mitigation**:
- Type definitions are in `src/typings/index.d.ts`
- Extension uses same types
- Framework handles type merging correctly

### Risk 3: Build Output

**Risk**: TypeScript extension file needs to be compiled correctly

**Mitigation**:
- Framework handles TypeScript compilation
- Build tools (tshy) will process the file
- Test compilation in build process

## Implementation Plan

### Phase 1: Create Extension File
- Create `src/app/extend/application.ts`
- Implement `io` getter with lazy initialization
- Initialize middleware and controller objects

### Phase 2: Update Boot Hook
- Remove `Reflect.defineProperty` from `boot.ts`
- Keep lifecycle initialization logic
- Ensure middleware/controller loading still works

### Phase 3: Testing
- Verify `app.io` is accessible
- Verify lazy initialization works
- Verify middleware/controller loading works
- Run existing tests

### Phase 4: Validation
- Run `openspec validate` to ensure specs are updated
- Verify type definitions are correct
- Ensure no breaking changes

