# @gulibs/tegg-socket.io

![NPM version](https://img.shields.io/npm/v/@gulibs/tegg-socket.io.svg?style=flat-square)

> [English](README.md)

基于 TypeScript 的 Tegg 运行时 Socket.IO 插件。

## 特性

- ✅ **装饰器路由** - 现代装饰器模式，灵感来自 Tegg HTTPController（新！）
- ✅ **TypeScript 支持** - 完整的 TypeScript 类型定义，零配置
- ✅ **双模块支持** - 通过 `tshy` 支持 ESM 和 CommonJS 构建
- ✅ **中间件系统** - 连接和包中间件，支持 Koa 风格组合
- ✅ **控制器系统** - 基于事件的控制器路由，自动发现
- ✅ **命名空间管理** - 多命名空间支持，每个命名空间独立中间件
- ✅ **Redis 适配器** - 可选 Redis 适配器，支持集群模式
- ✅ **辅助装饰器** - @Room, @Broadcast, @Subscribe 用于常见 Socket.IO 模式
- ✅ **向后兼容** - 同时支持装饰器和传统路由

## 要求

- Node.js >= 18.19.0
- Tegg 运行时（`@eggjs/core` >= 6.2）

## 安装

```bash
npm i @gulibs/tegg-socket.io
```

## 快速开始（装饰器风格）🎉

现代化的 Socket.IO 使用方式，采用装饰器模式，灵感来自 Tegg 的 HTTPController。

### 1. 启用插件

```typescript
// {app_root}/config/plugin.ts
export default {
  teggSocketIO: {
    enable: true,
    package: '@gulibs/tegg-socket.io',
  },
};
```

### 2. 创建装饰器控制器

```typescript
// {app_root}/app/io/controller/chat.ts
import { SocketIOController, SocketIOEvent, Room, Broadcast } from '@gulibs/tegg-socket.io';
import { Context } from '@eggjs/tegg';
import { AuthMiddleware } from '../middleware/auth';

@SocketIOController({
  namespace: '/',
  connectionMiddleware: [AuthMiddleware], // 直接引用类 - 类型安全！
})
export default class ChatController {
  @SocketIOEvent({ event: 'message' })
  async handleMessage(@Context() ctx: any) {
    const msg = ctx.args[0];
    ctx.socket.emit('response', `收到：${msg}`);
  }

  @SocketIOEvent({ event: 'joinRoom' })
  @Room({ name: 'lobby' })
  async joinLobby(@Context() ctx: any) {
    ctx.socket.emit('joined', '欢迎来到大厅！');
  }

  @SocketIOEvent({ event: 'broadcast' })
  @Broadcast({ to: 'lobby' })
  async broadcastMessage(@Context() ctx: any) {
    return { text: ctx.args[0], from: ctx.socket.id };
  }
}
```

### 3. 创建装饰器中间件

```typescript
// {app_root}/app/module/your-module/middleware/auth.ts
import { ConnectionMiddleware } from '@gulibs/tegg-socket.io';
import { Context } from '@eggjs/tegg';

@ConnectionMiddleware({ priority: 10 })
export class AuthMiddleware {
  async use(@Context() ctx: any, next: () => Promise<void>) {
    const token = ctx.socket.handshake.query.token;
    if (!token || token.length < 6) {
      ctx.socket.emit('error', '需要认证');
      ctx.socket.disconnect();
      return;
    }
    ctx.state.user = { id: 'user123', token };
    await next();
  }
}
```

### 4. 配置（可选）

装饰器会自动处理大部分配置，你只需要配置可选功能：

```typescript
// {app_root}/config/config.default.ts
export default () => {
  const config = {
    teggSocketIO: {
      // 可选：集群模式的 Redis 适配器
      redis: {
        host: '127.0.0.1',
        port: 6379,
      },
      // 可选：Engine.IO 选项
      init: {
        pingTimeout: 60000,
      },
    },
  };
  return config;
};
```

### 5. 不需要路由文件！🎉

使用装饰器后，路由会自动注册。不需要在 `app/router.ts` 中手动配置 Socket.IO 事件！

## 配置

> **现代方式：** 使用 `@SocketIOController` 装饰器来定义命名空间和中间件。配置文件只用于可选功能如 Redis 适配器。

### Redis 适配器（可选）

集群模式需要配置 Redis 适配器：

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

### Engine.IO 选项

```typescript
teggSocketIO: {
  init: {
    // 传递给 engine.io 的选项
    // 参见: https://socket.io/docs/v4/server-api/#new-serveroptions
  },
}
```

### 自定义 Socket ID 生成器

```typescript
teggSocketIO: {
  generateId: (request) => {
    return 'custom-id';
  },
}
```

## 使用方法

### 目录结构

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

**注意：** 控制器和中间件会自动在 `app/io/` 和 `app/module/*/` 目录中发现。

## 装饰器 API 参考

### @SocketIOController

标记一个类为 Socket.IO 控制器并配置其命名空间和中间件。

```typescript
@SocketIOController({
  namespace?: string;                        // 默认：'/'
  connectionMiddleware?: Array<Constructor | string>; // 中间件类或名称
  packetMiddleware?: Array<Constructor | string>;     // 中间件类或名称
})
```

**示例：**

```typescript
import { AuthMiddleware, AdminAuthMiddleware } from '../middleware';

@SocketIOController({
  namespace: '/admin',
  connectionMiddleware: [AuthMiddleware, AdminAuthMiddleware], // 直接类引用
  packetMiddleware: ['log', 'validate'], // 或字符串名称（如果在其他地方注册）
})
export default class AdminController {
  // ...
}
```

### @SocketIOEvent

标记方法为 Socket.IO 事件处理器。

```typescript
@SocketIOEvent({
  event: string;                   // 事件名称（必需）
  packetMiddleware?: string[];     // 事件专用中间件
})
```

**示例：**

```typescript
@SocketIOEvent({ event: 'chat' })
async handleChat(@Context() ctx: any) {
  const message = ctx.args[0];
  ctx.socket.emit('response', message);
}
```

### @ConnectionMiddleware

标记类为连接级中间件。

```typescript
@ConnectionMiddleware({
  priority?: number;  // 默认：100（数字越小越先执行）
})
```

**示例：**

```typescript
@ConnectionMiddleware({ priority: 10 })
export class AuthMiddleware {
  async use(@Context() ctx: any, next: () => Promise<void>) {
    // 连接逻辑
    await next();
    // 断开清理
  }
}
```

### @PacketMiddleware

标记类为包级中间件。

```typescript
@PacketMiddleware({
  priority?: number;  // 默认：100
})
```

**示例：**

```typescript
@PacketMiddleware({ priority: 50 })
export class LogMiddleware {
  async use(@Context() ctx: any, next: () => Promise<void>) {
    console.log('包：', ctx.packet);
    await next();
  }
}
```

### @Room

自动将 socket 加入房间（在方法执行前）。

```typescript
@Room({
  name: string | ((ctx: Context) => string | Promise<string>);
  autoLeave?: boolean;  // 默认：false
})
```

**示例：**

```typescript
// 静态房间名
@Room({ name: 'lobby' })
async joinLobby(@Context() ctx: any) {
  ctx.socket.emit('joined', '欢迎来到大厅');
}

// 动态房间名
@Room({ name: (ctx) => ctx.args[0] })
async joinRoom(@Context() ctx: any) {
  const roomName = ctx.args[0];
  ctx.socket.emit('joined', `欢迎来到 ${roomName}`);
}

// 执行后自动离开
@Room({ name: 'temporary', autoLeave: true })
async quickVisit(@Context() ctx: any) {
  // Socket 加入后会自动离开
}
```

### @Broadcast

自动将方法返回值广播到指定房间。

```typescript
@Broadcast({
  to?: string | string[];     // 目标房间
  event?: string;             // 自定义事件名
  includeSelf?: boolean;      // 默认：false
})
```

**示例：**

```typescript
// 广播到单个房间
@Broadcast({ to: 'lobby' })
async sendMessage(@Context() ctx: any) {
  return { text: ctx.args[0], from: ctx.socket.id };
}

// 广播到多个房间
@Broadcast({ to: ['room1', 'room2'] })
async multicast(@Context() ctx: any) {
  return { announcement: '大家好！' };
}

// 自定义事件名
@Broadcast({ to: 'lobby', event: 'newMessage' })
async createMessage(@Context() ctx: any) {
  return { id: Date.now(), text: ctx.args[0] };
}

// 包括发送者
@Broadcast({ to: 'group', includeSelf: true })
async groupMessage(@Context() ctx: any) {
  return { text: ctx.args[0] };
}
```

### @Subscribe

订阅 Socket.IO 系统事件。

```typescript
@Subscribe({
  event: 'connect' | 'disconnect' | 'disconnecting' | 'error';
})
```

**示例：**

```typescript
@Subscribe({ event: 'disconnect' })
async onDisconnect(@Context() ctx: any) {
  ctx.app.logger.info('用户断开连接：', ctx.socket.id);
  // 清理逻辑
}

@Subscribe({ event: 'error' })
async onError(@Context() ctx: any) {
  const error = ctx.args[0];
  ctx.app.logger.error('Socket 错误：', error);
}
```

### 装饰器组合

多个装饰器可以组合在同一个方法上：

```typescript
@SocketIOEvent({ event: 'groupChat' })
@Room({ name: 'chatroom' })
@Broadcast({ to: 'chatroom' })
async handleGroupChat(@Context() ctx: any) {
  // 1. Socket 加入 'chatroom'
  // 2. 方法执行
  // 3. 返回值广播到 'chatroom'
  return { text: ctx.args[0], from: ctx.socket.id };
}
```

**执行顺序：**
1. @Room（加入房间）
2. 方法执行
3. @Broadcast（广播结果）
4. @Room autoLeave（如果启用）

## TypeScript 支持

插件通过装饰器提供开箱即用的完整 TypeScript 支持：

### 内置类型安全

装饰器提供自动类型安全，无需任何配置：

```typescript
import { SocketIOController, SocketIOEvent, Room, Broadcast } from '@gulibs/tegg-socket.io';
import { Context } from '@eggjs/tegg';
import { AuthMiddleware } from '../middleware/auth';

@SocketIOController({
  namespace: '/',
  connectionMiddleware: [AuthMiddleware], // ✅ 类型安全的类引用
})
export default class ChatController {
  @SocketIOEvent({ event: 'message' })
  async handleMessage(@Context() ctx: any) {
    // ✅ 完整的 IntelliSense 支持
    const message = ctx.args[0];
    ctx.socket.emit('response', `收到：${message}`);
  }
}
```

### Context 类型扩展

插件扩展了 Egg 的 `Context`，添加了 Socket.IO 相关属性：

```typescript
interface Context {
  socket: Socket;    // Socket.IO socket 实例
  args?: unknown[];  // 客户端发送的事件参数
}
```

### 控制器中的使用

```typescript
@SocketIOController({ namespace: '/' })
export default class ChatController {
  @SocketIOEvent({ event: 'message' })
  async handleMessage(@Context() ctx: any) {
    // 访问 socket
    ctx.socket.emit('response', { success: true });

    // 访问参数（建议使用类型断言）
    const { text, userId } = ctx.args[0] as { text: string; userId: string };
  }
}

## 部署

### 集群模式

Socket.IO 在集群模式下需要启用粘性会话：

```bash

egg-bin dev --sticky
egg-scripts start --sticky

```

### Nginx 配置

```nginx

location / {
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host $host;
    proxy_pass http://127.0.0.1:{your_node_server_port};
}

```

## API 参考

### `app.io`

Socket.IO 服务器实例。

```typescript
// 获取 Socket.IO 服务器
const io = app.io;

// 获取命名空间
const nsp = app.io.of('/');

// 向所有客户端广播
app.io.emit('broadcast', data);
```

### `ctx.socket`

在中间件和控制器中可用的 Socket.IO socket 实例。

```typescript
// 向客户端发送事件
ctx.socket.emit('event', data);

// 加入房间
ctx.socket.join('room');

// 离开房间
ctx.socket.leave('room');

// 断开连接
ctx.socket.disconnect();
```

## 支持与问题

如需反馈问题或提交功能需求，请前往 [gulibs/tegg-socket.io issues](https://github.com/gulibs/tegg-socket.io/issues)。

## 许可证

MIT
