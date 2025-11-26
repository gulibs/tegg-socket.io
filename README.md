# @gulibs/tegg-socket.io

![NPM version](https://img.shields.io/npm/v/@gulibs/tegg-socket.io.svg?style=flat-square)

> [中文文档](README.zh_CN.md)

Socket.IO plugin for the Tegg runtime with first-class TypeScript support.

## Features

- ✅ **Decorator-Based Routing** - Modern decorator pattern inspired by Tegg HTTPController (NEW!)
- ✅ **TypeScript Support** - Full TypeScript type definitions with zero config
- ✅ **Dual Module Support** - ESM and CommonJS builds via `tshy`
- ✅ **Middleware System** - Connection and packet middleware with Koa-style composition
- ✅ **Controller System** - Event-based controller routing with auto-discovery
- ✅ **Namespace Management** - Multi-namespace support with per-namespace middleware
- ✅ **Redis Adapter** - Optional Redis adapter for cluster mode
- ✅ **Helper Decorators** - @Room, @Broadcast, @Subscribe for common Socket.IO patterns
- ✅ **Backward Compatible** - Works with both decorator and traditional routing

## Requirements

- Node.js >= 18.19.0
- Tegg runtime (`@eggjs/core` >= 6.2)

## Install

```bash
npm i @gulibs/tegg-socket.io
```

## Quick Start (Decorator Style) 🎉

The modern way to use Socket.IO with decorators, inspired by Tegg's HTTPController pattern.

### 1. Enable Plugin

```typescript
// {app_root}/config/plugin.ts
export default {
  teggSocketIO: {
    enable: true,
    package: '@gulibs/tegg-socket.io',
  },
};
```

### 2. Create Controller with Decorators

```typescript
// {app_root}/app/io/controller/chat.ts
import { SocketIOController, SocketIOEvent, Room, Broadcast } from '@gulibs/tegg-socket.io';
import { Context } from '@eggjs/tegg';
import { AuthMiddleware } from '../middleware/auth';

@SocketIOController({
  namespace: '/',
  connectionMiddleware: [AuthMiddleware], // Direct class reference - type-safe!
})
export default class ChatController {
  @SocketIOEvent({ event: 'message' })
  async handleMessage(@Context() ctx: any) {
    const msg = ctx.args[0];
    ctx.socket.emit('response', `Received: ${msg}`);
  }

  @SocketIOEvent({ event: 'joinRoom' })
  @Room({ name: 'lobby' })
  async joinLobby(@Context() ctx: any) {
    ctx.socket.emit('joined', 'Welcome to lobby!');
  }

  @SocketIOEvent({ event: 'broadcast' })
  @Broadcast({ to: 'lobby' })
  async broadcastMessage(@Context() ctx: any) {
    return { text: ctx.args[0], from: ctx.socket.id };
  }
}
```

### 3. Create Middleware with Decorators

```typescript
// {app_root}/app/module/your-module/middleware/auth.ts
import { ConnectionMiddleware } from '@gulibs/tegg-socket.io';
import { Context } from '@eggjs/tegg';

@ConnectionMiddleware({ priority: 10 })
export class AuthMiddleware {
  async use(@Context() ctx: any, next: () => Promise<void>) {
    const token = ctx.socket.handshake.query.token;
    if (!token || token.length < 6) {
      ctx.socket.emit('error', 'Authentication required');
      ctx.socket.disconnect();
      return;
    }
    ctx.state.user = { id: 'user123', token };
    await next();
  }
}
```

### 4. Configure (Optional)

Decorators handle most configuration automatically. You only need config for optional features:

```typescript
// {app_root}/config/config.default.ts
export default () => {
  const config = {
    teggSocketIO: {
      // Optional: Redis adapter for cluster mode
      redis: {
        host: '127.0.0.1',
        port: 6379,
      },
      // Optional: Engine.IO options
      init: {
        pingTimeout: 60000,
      },
    },
  };
  return config;
};
```

### 5. No Router File Needed! 🎉

With decorators, routes are automatically registered. No need to manually configure `app/router.ts` for Socket.IO events!

## Configuration

> **Modern Approach:** Use `@SocketIOController` decorators to define namespaces and middleware. Configuration is only needed for optional features like Redis adapter.

### Redis Adapter (Optional)

For cluster mode, configure Redis adapter:

```typescript
teggSocketIO: {
  redis: {
    host: '127.0.0.1',
    port: 6379,
    auth_pass: 'password',
    db: 0,
  },
}
```

### Engine.IO Options

```typescript
teggSocketIO: {
  init: {
    // Options passed to engine.io
    // See: https://socket.io/docs/v4/server-api/#new-serveroptions
  },
}
```

### Custom Socket ID Generator

```typescript
teggSocketIO: {
  generateId: (request) => {
    return 'custom-id';
  },
}
```

## Usage

### Directory Structure

```
app
├── module/
│   └── your-module/
│       ├── controller/
│       │   └── ChatController.ts
│       └── middleware/
│           ├── AuthMiddleware.ts
│           └── LogMiddleware.ts
config
├── config.default.ts
└── plugin.ts
```

**Note:** Controllers and middleware are automatically discovered in both `app/io/` and `app/module/*/` directories.

## Decorator API Reference

### @SocketIOController

Marks a class as a Socket.IO controller and configures its namespace and middleware.

```typescript
@SocketIOController({
  namespace?: string;                        // Default: '/'
  connectionMiddleware?: Array<Constructor | string>; // Middleware classes or names
  packetMiddleware?: Array<Constructor | string>;     // Middleware classes or names
})
```

**Example:**

```typescript
import { AuthMiddleware, AdminAuthMiddleware } from '../middleware';

@SocketIOController({
  namespace: '/admin',
  connectionMiddleware: [AuthMiddleware, AdminAuthMiddleware], // Direct class references
  packetMiddleware: ['log', 'validate'], // Or string names (if registered elsewhere)
})
export default class AdminController {
  // ...
}
```

### @SocketIOEvent

Marks a method as a Socket.IO event handler.

```typescript
@SocketIOEvent({
  event: string;                   // Event name (required)
  packetMiddleware?: string[];     // Event-specific middleware
})
```

**Example:**

```typescript
@SocketIOEvent({ event: 'chat' })
async handleChat() {
  const message = this.ctx.args[0];
  this.ctx.socket.emit('response', message);
}
```

### @ConnectionMiddleware

Marks a class as connection-level middleware.

```typescript
@ConnectionMiddleware({
  priority?: number;  // Default: 100 (lower executes first)
})
```

**Example:**

```typescript
@ConnectionMiddleware({ priority: 10 })
export class AuthMiddleware {
  async use(ctx: Context, next: () => Promise<void>) {
    // Connection logic
    await next();
    // Disconnection cleanup
  }
}
```

### @PacketMiddleware

Marks a class as packet-level middleware.

```typescript
@PacketMiddleware({
  priority?: number;  // Default: 100
})
```

**Example:**

```typescript
@PacketMiddleware({ priority: 50 })
export class LogMiddleware {
  async use(ctx: Context, next: () => Promise<void>) {
    console.log('Packet:', ctx.packet);
    await next();
  }
}
```

### @Room

Automatically joins socket to a room before method execution.

```typescript
@Room({
  name: string | ((ctx: Context) => string | Promise<string>);
  autoLeave?: boolean;  // Default: false
})
```

**Examples:**

```typescript
// Static room name
@Room({ name: 'lobby' })
async joinLobby() {
  this.ctx.socket.emit('joined', 'Welcome to lobby');
}

// Dynamic room name
@Room({ name: (ctx) => ctx.args[0] })
async joinRoom() {
  const roomName = this.ctx.args[0];
  this.ctx.socket.emit('joined', `Welcome to ${roomName}`);
}

// Auto-leave after execution
@Room({ name: 'temporary', autoLeave: true })
async quickVisit() {
  // Socket joins and automatically leaves after
}
```

### @Broadcast

Automatically broadcasts method return value to specified rooms.

```typescript
@Broadcast({
  to?: string | string[];     // Target room(s)
  event?: string;             // Custom event name
  includeSelf?: boolean;      // Default: false
})
```

**Examples:**

```typescript
// Broadcast to single room
@Broadcast({ to: 'lobby' })
async sendMessage() {
  return { text: this.ctx.args[0], from: this.ctx.socket.id };
}

// Broadcast to multiple rooms
@Broadcast({ to: ['room1', 'room2'] })
async multicast() {
  return { announcement: 'Hello everyone!' };
}

// Custom event name
@Broadcast({ to: 'lobby', event: 'newMessage' })
async createMessage() {
  return { id: Date.now(), text: this.ctx.args[0] };
}

// Include sender
@Broadcast({ to: 'group', includeSelf: true })
async groupMessage() {
  return { text: this.ctx.args[0] };
}
```

### @Subscribe

Subscribes to Socket.IO system events.

```typescript
@Subscribe({
  event: 'connect' | 'disconnect' | 'disconnecting' | 'error';
})
```

**Examples:**

```typescript
@Subscribe({ event: 'disconnect' })
async onDisconnect() {
  this.app.logger.info('User disconnected:', this.ctx.socket.id);
  // Cleanup logic
}

@Subscribe({ event: 'error' })
async onError() {
  const error = this.ctx.args[0];
  this.app.logger.error('Socket error:', error);
}
```

### Decorator Composition

Multiple decorators can be composed on the same method:

```typescript
@SocketIOEvent({ event: 'groupChat' })
@Room({ name: 'chatroom' })
@Broadcast({ to: 'chatroom' })
async handleGroupChat() {
  // 1. Socket joins 'chatroom'
  // 2. Method executes
  // 3. Return value is broadcast to 'chatroom'
  return { text: this.ctx.args[0], from: this.ctx.socket.id };
}
```

**Execution Order:**
1. @Room (join room)
2. Method execution
3. @Broadcast (broadcast result)
4. @Room autoLeave (if enabled)

## TypeScript Support

The plugin provides full TypeScript support out of the box with decorators:

### Built-in Type Safety

Decorators provide automatic type safety without any configuration:

```typescript
import { SocketIOController, SocketIOEvent, Room, Broadcast } from '@gulibs/tegg-socket.io';
import { Context } from '@eggjs/tegg';
import { AuthMiddleware } from '../middleware/auth';

@SocketIOController({
  namespace: '/',
  connectionMiddleware: [AuthMiddleware], // ✅ Type-safe class reference
})
export default class ChatController {
  @SocketIOEvent({ event: 'message' })
  async handleMessage(@Context() ctx: any) {
    // ✅ Full IntelliSense support
    const message = ctx.args[0];
    ctx.socket.emit('response', `Received: ${message}`);
  }
}
```

### Context Type Extensions

The plugin extends the Egg `Context` with Socket.IO-specific properties:

```typescript
interface Context {
  socket: Socket;    // Socket.IO socket instance
  args?: unknown[];  // Event arguments from client
}
```

### Usage in Controllers

```typescript
@SocketIOController({ namespace: '/' })
export default class ChatController {
  @SocketIOEvent({ event: 'message' })
  async handleMessage(@Context() ctx: any) {
    // Access socket
    ctx.socket.emit('response', { success: true });

    // Access arguments (type assertion recommended)
    const { text, userId } = ctx.args[0] as { text: string; userId: string };
  }
}

## Deployment

### Cluster Mode

Socket.IO requires sticky sessions in cluster mode:

```bash

egg-bin dev --sticky
egg-scripts start --sticky

```

### Nginx Configuration

```nginx

location / {
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host $host;
    proxy_pass http://127.0.0.1:{your_node_server_port};
}

```

## API Reference

### `app.io`

Socket.IO server instance.

```typescript

// Get Socket.IO server
const io = app.io;

// Get namespace
const nsp = app.io.of('/');

// Emit to all clients
app.io.emit('broadcast', data);

```

### `ctx.socket`

Socket.IO socket instance available in middleware and controllers.

```typescript

// Emit event to client
ctx.socket.emit('event', data);

// Join room
ctx.socket.join('room');

// Leave room
ctx.socket.leave('room');

// Disconnect
ctx.socket.disconnect();

```

## Support & Issues

Please use the [gulibs/tegg-socket.io issue tracker](https://github.com/gulibs/tegg-socket.io/issues) for questions or bug reports.

## License

MIT
