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
- ✅ **性能监控** - @PerformanceMonitor 装饰器用于指标收集
- ✅ **速率限制** - @RateLimit 装饰器用于请求限流
- ✅ **消息存储** - @MessageStorage 装饰器用于数据库持久化（MySQL、MongoDB、Redis）
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

### 消息存储配置

全局启用消息持久化：

```typescript
teggSocketIO: {
  messageStorage: {
    enabled: true, // 必须启用才能使用 @MessageStorage 装饰器
  },
}
```

**注意：** 你还需要安装并配置 `@gulibs/tegg-sequelize` 插件以访问数据库。

### 连接数限制配置

按命名空间限制连接数：

```typescript
teggSocketIO: {
  connectionLimit: {
    maxConnections: 1000, // 每个命名空间的最大连接数
    message: '连接数已满，请稍后再试。',
  },
}
```

**注意：** 连接数限制在新 socket 连接时检查。如果超过限制，连接会被拒绝并发送错误事件。

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

### @PerformanceMonitor

监控方法性能指标（执行时间、调用次数、错误率、吞吐量）。

```typescript
@PerformanceMonitor({
  enabled?: boolean;        // 默认：true
  sampleRate?: number;      // 默认：1.0 (0.0 到 1.0)
  metrics?: PerformanceMetric[];  // 默认：['duration', 'count', 'errorRate']
  logMetrics?: boolean;     // 默认：false
  onMetrics?: (metrics: PerformanceMetrics) => void | Promise<void>;
})
```

**示例：**

```typescript
@SocketIOEvent({ event: 'chat' })
@PerformanceMonitor({
  enabled: true,
  sampleRate: 1.0,
  metrics: ['duration', 'count', 'errorRate', 'throughput'],
  logMetrics: true
})
async handleChat(@Context() ctx: any) {
  // 性能指标会自动收集
}
```

### @RateLimit

限制每个时间窗口内的请求数量。

```typescript
@RateLimit({
  max?: number;            // 默认：10
  window?: number | string; // 默认：60000 (1 分钟) 或 '1m', '1h' 等
  key?: 'socket' | 'user' | 'ip' | ((ctx: Context) => string | Promise<string>);
  message?: string;        // 默认：'Rate limit exceeded'
  skip?: boolean;          // 默认：false
})
```

**示例：**

```typescript
@SocketIOEvent({ event: 'chat' })
@RateLimit({ max: 10, window: '1m', key: 'socket' })
async handleChat(@Context() ctx: any) {
  // 每个 socket 每分钟最多 10 次请求
}

@SocketIOEvent({ event: 'sendMessage' })
@RateLimit({ max: 100, window: 3600000, key: 'user' })
async sendMessage(@Context() ctx: any) {
  // 每个用户每小时最多 100 次请求
}
```

### @MessageStorage

自动将消息保存到数据库（MySQL、MongoDB 或 Redis）。

**前置要求：**
- 安装 `@gulibs/tegg-sequelize` 插件
- 在配置中启用消息存储：`config.teggSocketIO.messageStorage.enabled = true`
- 对于 MySQL/PostgreSQL：提供你自己的 Sequelize Model
- 对于 Redis/MongoDB：通过 `@gulibs/tegg-sequelize` 的 `customFactory` 配置

```typescript
@MessageStorage({
  adapter?: 'mysql' | 'mongodb' | 'redis';  // 默认：'mysql'
  table?: string;                          // 默认：'socket_messages'（MongoDB 的集合名）
  enabled?: boolean;                        // 默认：true
  events?: string[];                        // 要存储的事件白名单
  excludeEvents?: string[];                 // 要排除的事件黑名单
  ttl?: number;                            // Redis TTL（毫秒，默认：24 小时）
  model?: string | ModelCtor<Model>;        // Sequelize Model 名称或类（MySQL/PostgreSQL 必需）
  clientName?: string;                      // Sequelize 客户端名称（多客户端支持）
})
```

**示例：**

```typescript
// 示例 1：使用 Model 名称（推荐）
@SocketIOEvent({ event: 'chat' })
@MessageStorage({
  adapter: 'mysql',
  model: 'SocketMessage', // 从 sequelize.models 中的 Model 名称
  clientName: 'mysql', // 可选：用于多客户端支持
  enabled: true,
  events: ['chat', 'message'], // 只存储这些事件
  excludeEvents: ['ping', 'pong'] // 排除这些事件
})
async handleChat(@Context() ctx: any) {
  // 消息会使用 Sequelize Model 自动保存
}

// 示例 2：使用 Model 类
import { SocketMessage } from './models/SocketMessage';
@SocketIOEvent({ event: 'chat' })
@MessageStorage({
  adapter: 'mysql',
  model: SocketMessage, // 直接使用 Model 类
  enabled: true
})
async handleChat(@Context() ctx: any) {
  // 消息会自动保存
}

// 示例 3：Redis 适配器
@SocketIOEvent({ event: 'notification' })
@MessageStorage({
  adapter: 'redis',
  clientName: 'redis', // 通过 customFactory 配置的 Redis 客户端
  ttl: 3600000, // 1 小时 TTL
  enabled: true
})
async handleNotification(@Context() ctx: any) {
  // 消息会保存到 Redis，带 TTL
}

// 示例 4：MongoDB 适配器
@SocketIOEvent({ event: 'log' })
@MessageStorage({
  adapter: 'mongodb',
  clientName: 'mongodb', // 通过 customFactory 配置的 MongoDB 客户端
  table: 'socket_logs', // 集合名称
  enabled: true
})
async handleLog(@Context() ctx: any) {
  // 消息会保存到 MongoDB 集合
}
```

**配置：**

在配置中启用消息存储：

```typescript
// config/config.default.ts
export default () => {
  return {
    teggSocketIO: {
      messageStorage: {
        enabled: true, // 必须启用才能使用 @MessageStorage
      },
    },
  };
};
```

**数据库设置：**

对于 MySQL/PostgreSQL，创建你的 Sequelize Model：

```typescript
// app/models/SocketMessage.ts
import { Model, Column, Table, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'socket_messages',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
})
export class SocketMessage extends Model {
  @Column({ type: DataType.BIGINT, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.STRING(255), allowNull: false })
  event!: string;

  @Column({ type: DataType.STRING(255), allowNull: false, defaultValue: '/' })
  namespace!: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  room?: string;

  @Column({ type: DataType.STRING(255), allowNull: false })
  socketId!: string;

  @Column({ type: DataType.STRING(255), allowNull: true })
  userId?: string;

  @Column({ type: DataType.JSON, allowNull: false })
  data!: any;

  @Column({ type: DataType.DATE, allowNull: false, defaultValue: DataType.NOW })
  createdAt!: Date;
}
```

或手动创建表：

```sql
CREATE TABLE socket_messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  event VARCHAR(255) NOT NULL,
  namespace VARCHAR(255) NOT NULL DEFAULT '/',
  room VARCHAR(255),
  socket_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  data JSON NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_namespace_room (namespace, room),
  INDEX idx_socket_id (socket_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);
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

**完整示例（包含所有新装饰器）：**

```typescript
@SocketIOEvent({ event: 'sendMessage' })
@RateLimit({ max: 10, window: '1m', key: 'user' })
@PerformanceMonitor({ logMetrics: true })
@MessageStorage({
  adapter: 'mysql',
  model: 'SocketMessage',
  clientName: 'mysql'
})
@Room({ name: (ctx) => ctx.args[0].room })
@Broadcast({ to: (ctx) => ctx.args[0].room })
async sendMessage(@Context() ctx: any) {
  // 1. 速率限制检查
  // 2. Socket 加入房间
  // 3. 方法执行（性能监控）
  // 4. 消息保存到数据库
  // 5. 返回值广播到房间
  return { text: ctx.args[0].text, from: ctx.socket.id };
}
```

**执行顺序：**
1. @RateLimit（速率限制检查）
2. @Room（加入房间）
3. 方法执行
4. @PerformanceMonitor（记录性能指标）
5. @MessageStorage（保存消息到数据库）
6. @Broadcast（广播结果）
7. @Room autoLeave（如果启用）

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
