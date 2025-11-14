# TEGG wss Plugin
> tegg的Websocket插件

[![NPM](https://img.shields.io/npm/v/@gulibs/tegg-wss.svg)](https://www.npmjs.com/package/tegg-wss)

## 安装

```bash
npm install --save @gulibs/tegg-wss
```

**or**

```bash
yarn add @gulibs/tegg-wss
```
### 使用和配置

* `config.default.ts`

```typescript
const config = {
    wss: {
      options: {
        noServer: true
        // host: '127.0.0.1',
        // port: 9100
      },
      heartbeat: { // 开启心跳功能
        ms: 30000, //执行间隔时间
        logging: true //打印日志
      },
      namespace: {
        "/chat": {
          middleware: ['auth', 'chat']
        }
      }
    },
} as PowerPartial<EggAppConfig>;
```

* `plugin.ts`

```typescript
teggWebsocket: {
    enable: true,
    package: "@gulibs/tegg-wss"
}
```

* 中间件配置

创建`/app/wss/middleware`，然后在`/app/wss/middleware`目录创建中间件`.ts`文件.

### 所有配置

```typescript
interface TeggWssHeartbeat {
    ms?: number;
    logging?: boolean;
}

interface TeggWssConfig {
    options: ServerOptions;
    heartbeat?: TeggWssHeartbeat;
    generateClient?: (data: TeggWssRawFields) => TeggWssClient; //自定义client
    namespace: Record<string, TeggWssMiddleware>;
}

interface Application {
    wss: EggWebSocketServer;
    clientManager: ClientManager;
    currentClient: TeggWssClient;
}

interface EggAppConfig {
    wss: TeggWssConfig;
}
```