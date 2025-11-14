# Project Context

## Purpose
This project is a Socket.IO plugin for the Egg.js/Tegg framework (`@eggjs/tegg-socket.io`). It provides real-time WebSocket communication capabilities for Egg.js applications, enabling developers to build real-time features like instant messaging, notifications, live updates, and real-time analytics.

The plugin follows Egg.js plugin conventions and integrates Socket.IO seamlessly into the Egg.js application lifecycle, providing:
- Namespace-based connection management
- Connection and packet middleware support
- Controller-based event handling
- Router configuration for Socket.IO events
- Redis adapter support for cluster mode
- Session middleware integration

## Tech Stack
- **Language**: TypeScript (5.x)
- **Runtime**: Node.js (>=18.19.0)
- **Framework**: Egg.js (4.x) / Tegg framework
- **Core Dependencies**:
  - `@eggjs/core` (^6.2.13) - Egg.js core framework
  - `socket.io` (^4.8.1) - WebSocket framework
  - `socket.io-redis` (^6.1.1) - Redis adapter for Socket.IO
- **Build Tools**: tshy (for dual ESM/CJS builds)
- **Testing**: Egg.js test framework (egg-bin)

## Project Conventions

### Code Style
- **TypeScript**: Strict typing with comprehensive type definitions
- **ES Modules**: Uses ES modules (`type: "module"` in package.json)
- **Dual Build**: Supports both ESM and CommonJS exports via tshy
- **File Naming**: Use kebab-case for files, camelCase for exports
- **Imports**: Prefer Node.js built-in modules with `node:` prefix (e.g., `import http from 'node:http'`)
- **Linting**: ESLint with eggjs config
- **Code Organization**: 
  - Source code in `src/`
  - Types in `src/typings/` and inline
  - Config in `src/config/`
  - Library code in `src/lib/`

### Architecture Patterns
- **Plugin Architecture**: Follows Egg.js plugin pattern with `eggPlugin` configuration
- **FileLoader Pattern**: Uses Egg.js FileLoader to load controllers and middleware from `app/io/controller/` and `app/io/middleware/`
- **Middleware Composition**: Uses Koa-compose for middleware chaining (connection and packet middleware)
- **Symbol-based Configuration**: Uses Symbols for internal configuration storage (RouterConfigSymbol, CtxEventSymbol)
- **Lifecycle Integration**: Integrates with Egg.js application lifecycle hooks (`beforeStart`, `server` event)
- **Context Extension**: Extends Egg.js Context with Socket.IO-specific properties (socket, args, packet)
- **Namespace Management**: Configuration-based namespace setup with middleware support per namespace

### Testing Strategy
- **Test Framework**: Egg.js test framework (egg-bin)
- **Test Location**: Tests in `test/` directory
- **Fixtures**: Test fixtures in `test/fixtures/apps/`
- **Coverage**: Code coverage via egg-bin cov
- **Test Commands**: 
  - `npm test` - Run tests
  - `npm run ci` - Run tests with coverage
  - `npm run lint` - Lint code

### Git Workflow
- **Repository**: GitHub (eggjs/egg-tegg-socket.io)
- **License**: MIT
- **Branching**: Standard Git workflow
- **Commits**: Follow conventional commit messages
- **Publishing**: Public npm package (@eggjs/tegg-socket.io)

## Domain Context
- **Socket.IO Concepts**: 
  - Namespaces (nsp): Different connection endpoints/paths
  - Rooms: Subdivisions within namespaces for broadcasting
  - Connection Middleware: Executed on socket connection/disconnection
  - Packet Middleware: Executed on every message/packet
  - Events: Socket.IO events (connect, disconnect, error, custom events)
- **Egg.js Integration**:
  - Controllers extend `egg.Controller` and have access to `ctx`, `app`, `service`, `config`, `logger`
  - Middleware follows Koa-style async function pattern
  - Configuration via `config.teggSocketIO` (not `config.io` to match plugin name)
  - Load units: Supports multiple load units (app, plugin, framework)
- **Cluster Mode**: 
  - Requires sticky sessions for multi-process support
  - Redis adapter enables connection sharing across processes
  - Must use `--sticky` flag in development and production
- **System Events**: Special handling for `disconnect`, `error`, `disconnecting` events

## Important Constraints
- **Node.js Version**: Requires Node.js >=18.19.0
- **Sticky Sessions**: Must use sticky sessions in cluster mode (Socket.IO requirement)
- **Redis Configuration**: If using Redis adapter, must be separate from `@eggjs/redis` configuration
- **Middleware Compatibility**: Middleware must be compatible with Koa-style async functions
- **Type Safety**: Must maintain TypeScript type definitions for all public APIs
- **Backward Compatibility**: Should maintain compatibility with existing egg-socket.io API patterns where possible
- **Build Output**: Must support both ESM and CommonJS exports for compatibility

## External Dependencies
- **Socket.IO**: Core WebSocket framework, handles protocol and connection management
- **socket.io-redis**: Redis adapter for Socket.IO (optional, for cluster mode)
- **Egg.js Framework**: Application framework providing plugin system, lifecycle, and context
- **Koa**: Middleware framework (used via Egg.js, not directly)
- **Node.js HTTP Server**: Socket.IO attaches to HTTP server for WebSocket upgrade

## Key File Structure
```
src/
├── config/
│   └── config.default.ts    # Plugin configuration
├── lib/
│   ├── io.ts                # Main plugin initialization
│   ├── loader.ts            # Controller/middleware loader
│   ├── connectionMiddlewareInit.ts  # Connection middleware handler
│   ├── packetMiddlewareInit.ts      # Packet middleware handler
│   ├── types.ts             # TypeScript type definitions
│   ├── util.ts              # Utility functions
│   └── socket.io/
│       ├── index.ts         # Socket.IO Server wrapper
│       ├── namespace.ts     # Namespace extension
│       └── socket.ts        # Socket extension
└── typings/
    └── index.d.ts           # Type declarations
```

## Configuration Structure
```typescript
// config.teggSocketIO structure
{
  namespace: {
    '/': {
      connectionMiddleware: ['auth'],
      packetMiddleware: ['decrypt'],
    },
    '/example': {
      connectionMiddleware: [],
      packetMiddleware: [],
    },
  },
  redis: {
    host: '127.0.0.1',
    port: 6379,
    auth_pass: 'password',
    db: 0,
  },
  init: {}, // Options passed to engine.io
  generateId: (req) => string, // Custom socket ID generator
}
```

## Development Notes
- Plugin name is `teggSocketIO` (not `io`) to avoid conflicts
- Uses `app.io` as the Socket.IO server instance
- Controllers are loaded from `app/io/controller/` across all load units
- Middleware is loaded from `app/io/middleware/` across all load units
- Session middleware from Egg.js is automatically injected if available
- Debug logging uses `debug` package with namespace `egg-socket.io:lib:*`
