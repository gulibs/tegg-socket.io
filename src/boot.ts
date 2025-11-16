import type { ILifecycleBoot } from '@eggjs/core';
import debug from 'debug';
import type { Application, Context } from 'egg';
import is from 'is-type-of';
import type { Middleware as KoaMiddleware } from 'koa-compose';
import compose from 'koa-compose';
import assert from 'node:assert';
import type { Server as HTTPServer } from 'node:http';
import http from 'node:http';
import type { Socket } from 'socket.io';
import { connectionMiddlewareInit } from './lib/connectionMiddlewareInit.js';
import { CtxEventSymbol, packetMiddlewareInit } from './lib/packetMiddlewareInit.js';
import { ensureIoCollectionsLoaded } from './lib/loader.js';
import type {
  ComposedSocketIOMiddleware,
  ExtendedIncomingMessage,
  ExtendedNamespace,
  LoadedMiddleware,
  RuntimeSocketIOServer,
  SessionMiddleware,
  SocketIOContext,
  SocketIOMiddleware,
  SocketIOPacket,
} from './types.js';
import { RouterConfigSymbol } from './types.js';

const debugLog = debug('tegg-socket.io:lib:boot');

// System events that need special handling
const errorEvent: Record<string, number> = {
  disconnect: 1,
  error: 1,
  disconnecting: 1,
};

/**
 * Convert middleware to Koa-compatible middleware
 * This mimics egg-core's utils.middleware behavior
 * Handles function, class, and object-based middleware
 */
function toKoaMiddleware(mw: SocketIOMiddleware): KoaMiddleware<Context> {
  if (typeof mw === 'function') {
    return mw as KoaMiddleware<Context>;
  }
  // If it's a class, instantiate it
  if (is.class(mw)) {
    return new (mw as unknown as new () => KoaMiddleware<Context>)();
  }
  // If it's an object, return as-is (might be a factory function result)
  return mw as unknown as KoaMiddleware<Context>;
}

const LoadRouterWrappedSymbol = Symbol.for('TEGG-SOCKET.IO#WRAPPED_LOAD_ROUTER');

export class SocketIOBootHook implements ILifecycleBoot {
  private readonly app: Application;

  constructor(app: Application) {
    debugLog('[tegg-socket.io] SocketIOBootHook constructor called');
    this.app = app;
    const flagApp = app as Application & { [LoadRouterWrappedSymbol]?: boolean };
    if (!flagApp[LoadRouterWrappedSymbol]) {
      const originalLoadRouter = app.loader.loadRouter.bind(app.loader);
      app.loader.loadRouter = async (...args: Parameters<typeof originalLoadRouter>) => {
        debugLog('[tegg-socket.io] loadRouter hook triggered, accessing app.io...');
        const ioServer = this.app.io as RuntimeSocketIOServer;
        await ensureIoCollectionsLoaded(this.app, ioServer);
        debugLog('[tegg-socket.io] app.io ensured before loadRouter, app.io.controller = %o', this.app.io.controller);
        return originalLoadRouter(...args);
      };
      flagApp[LoadRouterWrappedSymbol] = true;
      debugLog('[tegg-socket.io] hooked loadRouter to ensure IO collections ready');
    }
  }

  /**
   * Config did load hook
   * Load controllers and middleware before router is loaded
   * This ensures app.io.controller and app.io.middleware are available in router files
   */
  async configDidLoad() {
    debugLog('[tegg-socket.io] configDidLoad hook called');
    const ioServer = this.app.io as RuntimeSocketIOServer;
    await ensureIoCollectionsLoaded(this.app, ioServer);
    debugLog('[tegg-socket.io] configDidLoad finished, app.io.controller = %o', this.app.io.controller);
  }

  /**
   * Will ready hook
   * Initialize namespaces and middleware before application is ready
   */
  async willReady() {
    this.app.logger.info('[tegg-socket.io] init started.');
    const ioServer = this.app.io as RuntimeSocketIOServer;
    await ensureIoCollectionsLoaded(this.app, ioServer);
    const config = this.app.config.teggSocketIO;
    const namespace = config.namespace || {};

    // Initialize namespaces
    for (const nsp in namespace) {
      const nspConfig = namespace[nsp];
      const connectionMiddlewareConfig = nspConfig.connectionMiddleware;
      const packetMiddlewareConfig = nspConfig.packetMiddleware;

      debugLog('[tegg-socket.io] connectionMiddlewareConfig: %o', connectionMiddlewareConfig);
      debugLog('[tegg-socket.io] packetMiddlewareConfig: %o', packetMiddlewareConfig);

      const connectionMiddlewares: SocketIOMiddleware[] = [];
      const packetMiddlewares: SocketIOMiddleware[] = [];

      // Type assertion needed because CustomMiddleware doesn't have index signature in types
      // but runtime uses LoadedMiddleware which does have index signature
      const middlewareMap = this.app.io.middleware as unknown as LoadedMiddleware;

      if (connectionMiddlewareConfig) {
        assert(is.array(connectionMiddlewareConfig), 'config.connectionMiddleware must be Array!');
        for (const middleware of connectionMiddlewareConfig) {
          assert(
            middlewareMap[middleware],
            `can't find middleware: ${middleware} !`,
          );
          connectionMiddlewares.push(middlewareMap[middleware]);
        }
      }

      if (packetMiddlewareConfig) {
        assert(is.array(packetMiddlewareConfig), 'config.packetMiddleware must be Array!');
        for (const middleware of packetMiddlewareConfig) {
          assert(
            middlewareMap[middleware],
            `can't find middleware: ${middleware} !`,
          );
          packetMiddlewares.push(middlewareMap[middleware]);
        }
      }

      debugLog('[tegg-socket.io] initNsp: %s', nsp);

      // Find session middleware if available
      // Type assertion needed because EggCore doesn't expose middleware array directly
      const app = this.app;
      const sessionMiddleware = (app.middleware || []).find((mw: unknown) => {
        return typeof mw === 'function' && (mw as { _name?: string })._name?.startsWith('session') === true;
      }) as SessionMiddleware | undefined;

      if (sessionMiddleware) {
        connectionMiddlewares.unshift(sessionMiddleware);
        packetMiddlewares.unshift(sessionMiddleware);
      }

      // Convert to Koa-compatible middleware and compose
      // This mimics egg-core's utils.middleware behavior
      const composedConnectionMiddlewares = compose(
        connectionMiddlewares.map(mw => toKoaMiddleware(mw)),
      ) as unknown as ComposedSocketIOMiddleware;

      const composedPacketMiddlewares = compose(
        packetMiddlewares.map(mw => toKoaMiddleware(mw)),
      ) as unknown as ComposedSocketIOMiddleware;

      debugLog('[tegg-socket.io] connectionMiddlewares: %o', connectionMiddlewares);
      debugLog('[tegg-socket.io] packetMiddlewares: %o', packetMiddlewares);

      this.initNsp(
        this.app.io.of(nsp) as ExtendedNamespace,
        composedConnectionMiddlewares,
        composedPacketMiddlewares,
        app,
      );
    }

    // Setup Redis adapter if configured
    if (config.redis) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const redis = require('socket.io-redis');
      const adapter = redis(config.redis);
      // https://github.com/socketio/socket.io-redis/issues/21
      // Attach error handler to the adapter instance
      if (adapter && typeof adapter.on === 'function') {
        adapter.on('error', (err: Error) => {
          this.app.coreLogger.error(err);
        });
      }
      this.app.io.adapter(adapter);
      this.app.logger.info('[tegg-socket.io] init socket.io-redis ready.');
    }

    // Register server event listener for Socket.IO attachment
    // This must be registered before server is created
    // Type assertion needed because EggCore doesn't have 'on' method in types
    // but Application does, and actual instance is Application
    this.app.on('server', (server: HTTPServer) => {
      this.app.io.attach(server, config.init);

      // Check whether it's a common function, it shouldn't be
      // an async or generator function, or it will be ignored.
      if (
        typeof config.generateId === 'function' &&
        !is.asyncFunction(config.generateId) &&
        !is.generatorFunction(config.generateId)
      ) {
        (this.app.io.engine as { generateId?: (req: unknown) => string }).generateId = config.generateId;
      }

      debugLog('[tegg-socket.io] init ready!');
    });
  }

  /**
   * Initialize namespace
   * Set up connection and packet middleware, and event handlers
   */
  private initNsp(
    nsp: ExtendedNamespace,
    connectionMiddlewares: ComposedSocketIOMiddleware,
    packetMiddlewares: ComposedSocketIOMiddleware,
    app: Application,
  ): void {
    nsp.on('connection', (socket: Socket) => {
      socket.use((packet: SocketIOPacket, next: (err?: Error) => void) => {
        packetMiddlewareInit(app, socket, packet, next, packetMiddlewares, nsp);
      });

      const routerMap = nsp[RouterConfigSymbol];
      if (routerMap) {
        for (const [event, handler] of routerMap.entries()) {
          if (errorEvent[event]) {
            socket.on(event, (...args: unknown[]) => {
              debugLog('[tegg-socket.io] socket closed: %o', args);
              const request = socket.request as unknown as ExtendedIncomingMessage & http.IncomingMessage;
              (request as ExtendedIncomingMessage).socket = socket;
              const ctx = app.createContext(request as http.IncomingMessage, new http.ServerResponse(request as http.IncomingMessage)) as unknown as SocketIOContext;
              ctx.args = args;
              Promise.resolve(handler.call(ctx as unknown as Context))
                .catch((e: Error) => {
                  e.message = '[tegg-socket.io] controller execute error: ' + e.message;
                  this.app.coreLogger.error(e);
                });
            });
          } else {
            socket.on(event, (...args: unknown[]) => {
              const ctx = args.splice(-1)[0] as SocketIOContext;
              ctx.args = ctx.req.args = args;
              Promise.resolve(handler.call(ctx as unknown as Context))
                .then(() => {
                  ctx[CtxEventSymbol]?.emit('finshed');
                })
                .catch((e: Error) => {
                  if (e instanceof Error) {
                    e.message = '[tegg-socket.io] controller execute error: ' + e.message;
                  } else {
                    debugLog(e);
                  }
                  ctx[CtxEventSymbol]?.emit('finshed', e);
                });
            });
          }
        }
      }
    });

    nsp.use((socket: Socket, next: (err?: Error) => void) => {
      connectionMiddlewareInit(app, socket, next, connectionMiddlewares);
    });
  }
}

