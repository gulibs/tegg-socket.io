# @gulibs/tegg-socket.io

> [English](README.md) | [中文](README.zh_CN.md)

基于 TypeScript 的 Egg.js/Tegg 框架 Socket.IO 插件。

## 特性

- ✅ **TypeScript 支持** - 完整的 TypeScript 类型定义
- ✅ **双模块支持** - 通过 `tshy` 支持 ESM 和 CommonJS 构建
- ✅ **中间件系统** - 基于 Koa 风格的连接和包中间件组合
- ✅ **控制器系统** - 基于事件的控制器路由
- ✅ **命名空间管理** - 多命名空间支持，每个命名空间可配置独立的中间件
- ✅ **Redis 适配器** - 可选 Redis 适配器，支持集群模式
- ✅ **FileLoader 模式** - 从 `app/io/` 目录自动加载中间件和控制器

## 要求

- Node.js >= 18.19.0
- Egg.js >= 4.0

## 安装

```bash
npm i @gulibs/tegg-socket.io
```

## 快速开始

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

### 2. 配置插件

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

### 3. 创建中间件

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

### 4. 创建控制器

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

### 5. 配置路由

```typescript
// {app_root}/app/router.ts
import type { Application } from 'egg';

export default (app: Application) => {
  app.io.route('chat', app.io.controller.chat.ping);
};
```

## 配置

### 命名空间配置

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

### 连接中间件

连接中间件在 Socket 连接或断开时执行。

```typescript
// {app_root}/app/io/middleware/auth.ts
import type { Context, Application } from 'egg';

export default (app: Application) => {
  return async (ctx: Context, next: () => Promise<void>) => {
    // 连接时执行
    ctx.socket.emit('res', 'connected!');

    await next();

    // 断开连接时执行（next() 之后）
    console.log('disconnected!');
  };
};
```

### 包中间件

包中间件在每个 Socket.IO 事件包时执行。

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

### 控制器

控制器处理 Socket.IO 事件。可以是基于类的或基于函数的。

#### 基于类的控制器

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

#### 基于函数的控制器

```typescript
// {app_root}/app/io/controller/chat.ts
import type { Context } from 'egg';

export async function ping(this: Context) {
  const message = this.args[0];
  this.socket.emit('res', `Message: ${message}`);
}
```

### 路由

在 `app/router.ts` 中配置事件路由：

```typescript
// {app_root}/app/router.ts
import type { Application } from 'egg';

export default (app: Application) => {
  app.io.route('chat', app.io.controller.chat.ping);
  app.io.route('disconnect', app.io.controller.chat.disconnect);
};
```

### 控制器上下文

控制器可以访问以下属性：

- `this.ctx` - Egg.js Context 对象
- `this.ctx.socket` - Socket.IO socket 实例
- `this.ctx.args` - 事件参数数组
- `this.ctx.packet` - Socket.IO 包（在包中间件中可用）
- `this.app` - Application 实例
- `this.service` - Service 实例
- `this.config` - 配置对象
- `this.logger` - Logger 实例

## TypeScript 支持

本插件提供完整的 TypeScript 支持，有两种类型生成方式：

### 方式一：使用 egg-ts-helper 自动生成类型（推荐）✨

[egg-ts-helper](https://github.com/eggjs/egg-ts-helper) 可以自动为你的 Socket.IO 控制器和中间件生成类型定义。

#### 配置步骤

1. **确保已安装 egg-ts-helper**（大多数 Egg.js + TypeScript 项目已经安装）：

```bash
npm install egg-ts-helper --save-dev
```

2. **在项目根目录配置 `tshelper.json`**：

```json
{
  "generatorConfig": {
    "io/middleware": {
      "directory": "app/io/middleware",
      "pattern": "**/*.(ts|js)",
      "generator": "function",
      "interface": "CustomMiddleware",
      "enabled": true,
      "caseStyle": "camel",
      "declareTo": "Application.io.middleware"
    },
    "io/controller": {
      "directory": "app/io/controller",
      "pattern": "**/*.(ts|js)",
      "generator": "class",
      "interface": "CustomController",
      "enabled": true,
      "caseStyle": "camel",
      "declareTo": "Application.io.controller"
    }
  }
}
```

**注意**：本插件已包含此配置文件 `tshelper.json`，可以直接复制到你的项目中使用。

3. **启动开发服务器并自动生成类型**：

```bash
npm run dev  # egg-ts-helper 会自动运行
```

或手动生成类型：

```bash
npx ets        # 生成一次
npx ets -w     # 监听模式
```

#### 使用示例

使用 egg-ts-helper 后，无需手动声明类型：

```typescript
// app/io/middleware/auth.ts
// ✅ 无需手动声明类型！
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
// ✅ 无需手动声明类型！
import { Controller } from 'egg';

export default class ChatController extends Controller {
  async message() {
    // 安全访问 Socket.IO 参数
    const data = this.ctx.args![0];
    this.app.io.emit('message', data);
  }
}
```

egg-ts-helper 会自动在 `typings/app/io/index.d.ts` 中生成：

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

现在你可以获得完整的 IntelliSense 支持：

```typescript
app.io.middleware.auth         // ✅ 类型安全
app.io.controller.chat         // ✅ 类型安全
this.ctx.args                  // ✅ 类型安全 (unknown[])
this.ctx.socket                // ✅ 类型安全
```

### 方式二：手动声明类型

如果你不想使用 egg-ts-helper，可以手动声明类型：

#### 扩展中间件类型

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
    // 你的认证逻辑
    await next();
  };
}
```

#### 扩展控制器类型

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

### Context 类型扩展

插件扩展了 Egg 的 `Context`，添加了 Socket.IO 相关属性：

```typescript
interface Context {
  socket?: Socket;   // Socket.IO socket 实例
  args?: unknown[];  // 客户端发送的消息参数
}
```

在控制器中的使用：

```typescript
export default class ChatController extends Controller {
  async message() {
    // 访问 socket
    this.ctx.socket.emit('response', { success: true });

    // 访问消息参数（建议使用类型断言）
    const { text, userId } = this.ctx.args![0] as { text: string; userId: string };

    // 或使用解构
    const [firstArg, secondArg] = this.ctx.args || [];
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

// 注册路由
app.io.route('event', handler);

```

### `ctx.socket`

在中间件和控制器中可用的 Socket.IO socket 实例。

```typescript

// 发送事件
ctx.socket.emit('event', data);

// 加入房间
ctx.socket.join('room');

// 离开房间
ctx.socket.leave('room');

// 断开连接
ctx.socket.disconnect();

```

## 许可证

MIT
