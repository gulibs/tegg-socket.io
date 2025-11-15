import http from 'node:http';
import assert from 'node:assert';
import is from 'is-type-of';
import type { Middleware as KoaMiddleware } from 'koa-compose';
import type { EggCore, ILifecycleBoot } from '@eggjs/core';
import type { Application, Context } from 'egg';
import type { Server as HTTPServer } from 'node:http';
import type { Socket } from 'socket.io';
import compose from 'koa-compose';
import { loadControllersAndMiddleware } from './lib/loader.js';
import { connectionMiddlewareInit } from './lib/connectionMiddlewareInit.js';
import { packetMiddlewareInit, CtxEventSymbol } from './lib/packetMiddlewareInit.js';
import { RouterConfigSymbol } from './lib/types.js';
import type {
  SocketIOMiddleware,
  ComposedSocketIOMiddleware,
  ExtendedNamespace,
  SocketIOContext,
  SessionMiddleware,
  SocketIOPacket,
  ExtendedIncomingMessage,
  LoadedMiddleware,
} from './lib/types.js';
import debug from 'debug';

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

/**
 * Socket.IO Boot Hook
 * Implements ILifecycleBoot interface for modern Tegg plugin pattern
 */
export class SocketIOBootHook implements ILifecycleBoot {
  private readonly app: EggCore;

  constructor(app: EggCore) {
    this.app = app;
  }

  /**
   * Config did load hook
   * Load controllers and middleware before router is loaded
   * This ensures app.io.controller and app.io.middleware are available in router files
   */
  configDidLoad() {
    // Load controllers and middleware using FileLoader pattern
    // app.io is now defined in app/extend/application.ts (loaded before boot.ts)
    // Type assertion needed because EggCore doesn't have all Application properties
    // but loadControllersAndMiddleware only needs the loader property
    loadControllersAndMiddleware(this.app as unknown as Application);
  }

  /**
   * Did load hook
   * This hook is kept for future extension logic if needed
   */
  async didLoad() {
    // Controllers and middleware are now loaded in configDidLoad
    // This matches the traditional Egg.js plugin pattern
  }

  /**
   * Will ready hook
   * Initialize namespaces and middleware before application is ready
   */
  async willReady() {
    const config = this.app.config.teggSocketIO;
    const namespace = config.namespace || {};

    debugLog('[tegg-socket.io] init start!');

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
      const app = this.app as unknown as Application;
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
      debugLog('[tegg-socket.io] init socket.io-redis ready!');
    }

    // Register server event listener for Socket.IO attachment
    // This must be registered before server is created
    // Type assertion needed because EggCore doesn't have 'on' method in types
    // but Application does, and actual instance is Application
    (this.app as unknown as Application).on('server', (server: HTTPServer) => {
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
              const ctx = app.createContext(request as http.IncomingMessage, new http.ServerResponse(request as http.IncomingMessage)) as SocketIOContext;
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

