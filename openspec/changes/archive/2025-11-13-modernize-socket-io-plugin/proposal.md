# Change: Modernize Socket.IO Plugin for Tegg Framework

## Why

The current `@eggjs/tegg-socket.io` plugin is a modernization of the legacy `egg-socket.io` plugin, but it needs to:
1. **Align with modern Tegg plugin patterns** - Follow the structure and lifecycle patterns established by modern plugins like `@eggjs/mysql` (mysql-master)
2. **Complete migration from egg-socket.io-master** - Ensure all features from the original implementation are properly migrated and enhanced for TypeScript and modern Egg.js/Tegg framework
3. **Adopt best practices from tegg-wss** - Incorporate modern middleware and controller loading patterns
4. **Establish comprehensive specifications** - Document all capabilities to enable proper maintenance and evolution

The original `egg-socket.io` (v4.1.6) was built for Node.js 8+ with Socket.IO 2.x and older Egg.js patterns. The current project modernizes this but needs formal specification and alignment with latest standards.

## What Changes

This proposal establishes specifications for:
1. **Socket.IO Integration** - Core Socket.IO server initialization, lifecycle, and HTTP server attachment
2. **Middleware System** - Connection and packet middleware loading, composition, and execution
3. **Controller System** - Event-based controller loading and routing
4. **Namespace Management** - Configuration-based namespace setup with per-namespace middleware
5. **Redis Adapter** - Optional Redis adapter for cluster mode support

### Modern Patterns to Adopt

- Follow `@eggjs/mysql` structure: `agent.ts`, `app.ts`, `boot.ts` pattern with `ILifecycleBoot`
- Use FileLoader pattern from `tegg-wss` for middleware/controller loading
- Maintain TypeScript strict typing throughout
- Support dual ESM/CJS builds via tshy
- Modern tooling: oxlint (or eslint), husky, lint-staged, prettier

## Impact

- **Affected specs**: All new specifications (no existing specs to modify)
- **Affected code**: 
  - Plugin structure may need refactoring to follow `boot.ts` pattern
  - Type definitions need comprehensive coverage
  - Configuration structure alignment with modern patterns
- **Breaking changes**: None - this establishes specs for existing functionality
- **Migration path**: Current implementation will be validated against new specs and adjusted if needed

## References

- **Reference implementations**:
  - `refers/mysql-master` - Modern plugin pattern (agent.ts, app.ts, boot.ts)
  - `refers/egg-socket.io-master` - Original implementation to ensure feature parity
  - `refers/tegg-wss` - Modern middleware/controller loading patterns
- **Related docs**: `refers/docs/tegg文档/教程/Socket.IO.md` - Socket.IO usage patterns

