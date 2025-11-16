# @gulibs/tegg-socket.io

![NPM version](https://img.shields.io/npm/v/@gulibs/tegg-socket.io.svg?style=flat-square)

> [中文文档](README.zh_CN.md)

Socket.IO plugin for the Tegg runtime with first-class TypeScript support.

## Features

- ✅ **TypeScript Support** - Full TypeScript type definitions
- ✅ **Dual Module Support** - ESM and CommonJS builds via `tshy`
- ✅ **Middleware System** - Connection and packet middleware with Koa-style composition
- ✅ **Controller System** - Event-based controller routing
- ✅ **Namespace Management** - Multi-namespace support with per-namespace middleware
- ✅ **Redis Adapter** - Optional Redis adapter for cluster mode
- ✅ **FileLoader Pattern** - Loads middleware and controllers from `app/io/` directories

## Requirements

- Node.js >= 18.19.0
- Tegg runtime (`@eggjs/core` >= 6.2)

## Install

```bash
npm i @gulibs/tegg-socket.io
```

## Quick Start

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

### 2. Configure Plugin

```typescript
// {app_root}/config/config.default.ts
import type { EggAppConfig, PowerPartial } from 'egg';

export default () => {
  const config: PowerPartial<EggAppConfig> = {
    teggSocketIO: {
      namespace: {
        '/': {
          connectionMiddleware: ['auth'],
          packetMiddleware: ['filter'],
        },
      },
    },
  };
  return config;
};
```

### 3. Create Middleware

```typescript
// {app_root}/app/io/middleware/auth.ts
import type { Context, Application } from 'egg';

export default (app: Application) => {
  return async (ctx: Context, next: () => Promise<void>) => {
    ctx.socket.emit('res', 'connected!');
    await next();
    console.log('disconnected!');
  };
};
```

### 4. Create Controller

```typescript
// {app_root}/app/io/controller/chat.ts
import type { Application } from 'egg';

export default (app: Application) => {
  class ChatController extends app.Controller {
    async ping() {
      const message = this.ctx.args[0];
      this.ctx.socket.emit('res', `Hi! I've got your message: ${message}`);
    }
  }
  return ChatController;
};
```

### 5. Configure Router

```typescript
// {app_root}/app/router.ts
import type { Application } from 'egg';

export default (app: Application) => {
  app.io.route('chat', app.io.controller.chat.ping);
};
```

## Configuration

### Namespace Configuration

```typescript
// {app_root}/config/config.default.ts
export default () => {
  const config: PowerPartial<EggAppConfig> = {
    teggSocketIO: {
      namespace: {
        '/': {
          connectionMiddleware: ['auth'],
          packetMiddleware: ['filter'],
        },
        '/example': {
          connectionMiddleware: ['auth'],
          packetMiddleware: [],
        },
      },
    },
  };
  return config;
};
```

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
├── io
│   ├── controller
│   │   └── chat.ts
│   └── middleware
│       ├── auth.ts
│       └── filter.ts
├── router.ts
config
├── config.default.ts
└── plugin.ts
```

### Connection Middleware

Connection middleware executes when a socket connects or disconnects.

```typescript
// {app_root}/app/io/middleware/auth.ts
import type { Context, Application } from 'egg';

export default (app: Application) => {
  return async (ctx: Context, next: () => Promise<void>) => {
    // Execute on connection
    ctx.socket.emit('res', 'connected!');

    await next();

    // Execute on disconnect (after next())
    console.log('disconnected!');
  };
};
```

### Packet Middleware

Packet middleware executes on every Socket.IO event packet.

```typescript
// {app_root}/app/io/middleware/filter.ts
import type { Context, Application } from 'egg';

export default (app: Application) => {
  return async (ctx: Context, next: () => Promise<void>) => {
    console.log('packet:', ctx.packet);
    await next();
  };
};
```

### Controller

Controllers handle Socket.IO events. They can be class-based or function-based.

#### Class-based Controller

```typescript
// {app_root}/app/io/controller/chat.ts
import type { Application } from 'egg';

export default (app: Application) => {
  class ChatController extends app.Controller {
    async ping() {
      const message = this.ctx.args[0];
      this.ctx.socket.emit('res', `Message: ${message}`);
    }
  }
  return ChatController;
};
```

#### Function-based Controller

```typescript
// {app_root}/app/io/controller/chat.ts
import type { Context } from 'egg';

export async function ping(this: Context) {
  const message = this.args[0];
  this.socket.emit('res', `Message: ${message}`);
}
```

### Router

Configure event routing in `app/router.ts`:

```typescript
// {app_root}/app/router.ts
import type { Application } from 'egg';

export default (app: Application) => {
  app.io.route('chat', app.io.controller.chat.ping);
  app.io.route('disconnect', app.io.controller.chat.disconnect);
};
```

### Controller Context

Controllers have access to:

- `this.ctx` - application Context object
- `this.ctx.socket` - Socket.IO socket instance
- `this.ctx.args` - Event arguments array
- `this.ctx.packet` - Socket.IO packet (in packet middleware)
- `this.app` - Application instance
- `this.service` - Service instances
- `this.config` - Configuration
- `this.logger` - Logger instance

## TypeScript Support

This plugin provides full TypeScript support with two approaches for type generation:

### Option 1: Automatic Type Generation with `ets` (Recommended) ✨

Use the [`ets` CLI](https://www.npmjs.com/package/egg-ts-helper) to automatically generate type definitions for your Socket.IO controllers and middleware.

#### Setup

1. **Install the CLI** (most Tegg + TypeScript projects already have it):

```bash
npm install egg-ts-helper --save-dev
```

2. **Run the generator with the plugin-provided config** (no files to copy):

```bash
npx ets --config ./node_modules/@gulibs/tegg-socket.io/tshelper.json
```

3. **Watch & regenerate automatically** (optional):

```bash
npx ets -w --config ./node_modules/@gulibs/tegg-socket.io/tshelper.json
```

Or manually generate types:

```bash
npx ets        # Generate once
npx ets -w     # Watch mode
```

#### Usage Example

With `ets`, you don't need to manually declare types:

```typescript
// app/io/middleware/auth.ts
// ✅ No manual type declaration needed!
export default function auth() {
  return async (ctx, next) => {
    const token = ctx.socket.handshake.headers.authorization;
    if (!token) {
      ctx.socket.disconnect();
      return;
    }
    await next();
  };
}
```

```typescript
// app/io/controller/chat.ts
// ✅ No manual type declaration needed!
import { Controller } from 'egg';

export default class ChatController extends Controller {
  async message() {
    // Access Socket.IO arguments safely
    const data = this.ctx.args![0];
    this.app.io.emit('message', data);
  }
}
```

The generator will produce `typings/app/io/index.d.ts` with:

```typescript
declare module 'egg' {
  interface CustomMiddleware {
    auth: typeof auth;
  }

  interface CustomController {
    chat: typeof ChatController;
  }
}
```

Now you get full IntelliSense:

```typescript
app.io.middleware.auth         // ✅ Type-safe
app.io.controller.chat         // ✅ Type-safe
this.ctx.args                  // ✅ Type-safe (unknown[])
this.ctx.socket                // ✅ Type-safe
```

#### Router Initialization Safety

- The plugin preloads controllers and middleware before router files run, and also hooks the router loader so a router access triggers loading if it somehow happens first.
- It's safe to reference `app.io.controller.*` or `app.io.middleware.*` inside `app/router.ts` (even during module evaluation); the loader hook guarantees the objects exist before your code touches them.

### Option 2: Manual Type Declaration

If you prefer not to use egg-ts-helper, you can manually declare types:

#### Extend Middleware Types

```typescript
// app/io/middleware/auth.ts
import { Application, Context } from 'egg';

declare module 'egg' {
  interface CustomMiddleware {
    auth: (app: Application) => (ctx: Context, next: () => Promise<void>) => Promise<void>;
  }
}

export default function auth(app: Application) {
  return async (ctx: Context, next: () => Promise<void>) => {
    // Your auth logic
    await next();
  };
}
```

#### Extend Controller Types

```typescript
// app/io/controller/chat.ts
import { Controller } from 'egg';

declare module 'egg' {
  interface CustomController {
    chat: ChatController;
  }
}

export default class ChatController extends Controller {
  async message() {
    const data = this.ctx.args![0];
    this.app.io.emit('message', data);
  }
}
```

### Context Type Extensions

The plugin extends the application `Context` with Socket.IO-specific properties:

```typescript
interface Context {
  socket?: Socket;   // Socket.IO socket instance
  args?: unknown[];  // Message arguments from client
}
```

Usage in controllers:

```typescript
export default class ChatController extends Controller {
  async message() {
    // Access socket
    this.ctx.socket.emit('response', { success: true });

    // Access message arguments (type assertion recommended)
    const { text, userId } = this.ctx.args![0] as { text: string; userId: string };

    // Or with destructuring
    const [firstArg, secondArg] = this.ctx.args || [];
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

// Register route
app.io.route('event', handler);

```

### `ctx.socket`

Socket.IO socket instance available in middleware and controllers.

```typescript

// Emit event
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
