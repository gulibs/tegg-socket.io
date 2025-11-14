# Change: Refactor to Boot Hook Pattern with Application Extension

## Why

The current Socket.IO plugin implementation uses a function-based initialization pattern (`app.ts` exports a function), but modern Egg.js/Tegg plugins should use the `ILifecycleBoot` interface with boot hooks. Additionally, the `app.io` extension should be implemented using the modern pattern (similar to `@eggjs/mysql`) rather than the legacy `app/extend/application.js` pattern.

The original `egg-socket.io-master` used `app/extend/application.js` to extend Application with `app.io` getter. While this works, the modern approach is:
1. Use `boot.ts` with `ILifecycleBoot` interface for lifecycle management
2. Define `app.io` extension in `configDidLoad()` using `Reflect.defineProperty` (like mysql-master)
3. Use proper lifecycle hooks (`didLoad`, `willReady`, `serverDidReady`) instead of `beforeStart` and event listeners

## What Changes

This proposal refactors the plugin to:
1. **Create `boot.ts`** - Implement `ILifecycleBoot` interface with proper lifecycle methods
2. **Refactor `app.ts`** - Export the boot hook class instead of initialization function
3. **Application Extension** - Move `app.io` getter definition to `configDidLoad()` using modern pattern
4. **Lifecycle Methods** - Migrate initialization logic to appropriate lifecycle hooks:
   - `configDidLoad()` - Define `app.io` extension
   - `didLoad()` - Load controllers and middleware
   - `willReady()` - Initialize namespaces and middleware
   - `serverDidReady()` - Attach Socket.IO to HTTP server (or use `app.on('server')`)

## Impact

- **Affected specs**: 
  - Socket.IO Integration spec - Lifecycle integration needs updating
  - Application Extension spec - New capability to document
- **Affected code**:
  - `src/app.ts` - Change from function export to boot hook export
  - `src/lib/io.ts` - Refactor initialization logic into boot hook class
  - `src/boot.ts` - New file implementing `ILifecycleBoot`
  - Type definitions - Ensure proper typing for boot hook
- **Breaking changes**: None - Internal refactoring, API remains the same
- **Migration path**: Current implementation will be refactored while maintaining same behavior

## References

- **Reference implementations**:
  - `refers/mysql-master/src/boot.ts` - Modern boot hook pattern with `ILifecycleBoot`
  - `refers/mysql-master/src/app.ts` - Export boot hook class
  - `refers/egg-socket.io-master/app/extend/application.js` - Legacy extension pattern (to be replaced)
- **Related docs**: `refers/docs/tegg文档/基础功能/启动自定义.md` - Lifecycle hooks documentation

