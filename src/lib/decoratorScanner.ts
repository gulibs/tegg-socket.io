/**
 * Decorator Scanner
 * Scans and registers decorator-based Socket.IO controllers and middleware
 * Uses Egg.js FileLoader to properly load TypeScript/JavaScript files
 */

import type { Application, Context } from 'egg';
import type { Socket } from 'socket.io';
import http from 'node:http';
import debug from 'debug';
import {
  isSocketIOController,
  getSocketIOControllerMetadata,
  getAllSocketIOEvents,
  isConnectionMiddleware,
  isPacketMiddleware,
  getConnectionMiddlewareMetadata,
  getPacketMiddlewareMetadata,
  getRoomMetadata,
  getBroadcastMetadata,
  type SocketIOControllerMetadata,
  type SocketIOEventMetadata,
  type Constructor,
} from './decorators/index.js';
import type { RuntimeSocketIOServer, RouteHandler, SocketIOContext, ExtendedIncomingMessage } from '../types.js';
import { RouterConfigSymbol, CtxEventSymbol } from '../types.js';
import type { ExtendedNamespace } from '../types.js';

const debugLog = debug('tegg-socket.io:decorator-scanner');

// System events that need special handling
const errorEvent: Record<string, number> = {
  disconnect: 1,
  error: 1,
  disconnecting: 1,
};

/**
 * Decorated controller information
 */
interface DecoratedController {
  controllerClass: Constructor;
  metadata: SocketIOControllerMetadata;
  events: Map<string, SocketIOEventMetadata>;
}


/**
 * Extract all exported classes from a module
 */
function extractClasses(exportedModule: any): Constructor[] {
  const classes: Constructor[] = [];

  if (typeof exportedModule === 'function') {
    classes.push(exportedModule);
  } else if (typeof exportedModule === 'object' && exportedModule !== null) {
    for (const key in exportedModule) {
      if (typeof exportedModule[key] === 'function') {
        classes.push(exportedModule[key]);
      }
    }
  }

  return classes;
}

/**
 * Register controllers
 */
async function registerControllers(
  app: Application,
  ioServer: RuntimeSocketIOServer,
  controllers: DecoratedController[],
): Promise<void> {
  for (const { controllerClass, metadata, events } of controllers) {
    const namespace = metadata.namespace || '/';
    const nsp = ioServer.of(namespace) as ExtendedNamespace;

    if (!nsp[RouterConfigSymbol]) {
      nsp[RouterConfigSymbol] = new Map();
    }

    const routerMap = nsp[RouterConfigSymbol];

    for (const [methodName, eventMetadata] of events) {
      const roomMetadata = getRoomMetadata(controllerClass.prototype[methodName]);
      const broadcastMetadata = getBroadcastMetadata(controllerClass.prototype[methodName]);

      const handler: RouteHandler = async function (this: any) {
        const instance = new controllerClass() as any;

        instance.ctx = this;
        instance.app = this.app;
        instance.config = (this.app as any).config;
        instance.service = this.service;
        instance.logger = this.logger;

        const result = await instance[methodName]();

        if (roomMetadata) {
          const roomName =
            typeof roomMetadata.name === 'function' ? await roomMetadata.name(this) : (roomMetadata.name as string);

          this.socket.join(roomName);
          debugLog('Socket %s joined room %s', this.socket.id, roomName);

          if (roomMetadata.autoLeave) {
            this.socket.on('disconnect', () => {
              this.socket.leave(roomName);
              debugLog('Socket %s left room %s on disconnect', this.socket.id, roomName);
            });
          }
        }

        if (broadcastMetadata) {
          const eventName = broadcastMetadata.event || eventMetadata.event;
          const broadcastData = result;

          let targetRooms: string | string[] | undefined;
          if (typeof broadcastMetadata.to === 'function') {
            targetRooms = await broadcastMetadata.to(this);
          } else {
            targetRooms = broadcastMetadata.to;
          }

          if (targetRooms) {
            const rooms = Array.isArray(targetRooms) ? targetRooms : [targetRooms];
            for (const room of rooms) {
              debugLog('Broadcasting to room %s with event %s', room, eventName);
              if (broadcastMetadata.includeSelf) {
                app.io.to(room).emit(eventName, broadcastData);
              } else {
                this.socket.to(room).emit(eventName, broadcastData);
              }
            }
          } else {
            debugLog('Broadcasting to namespace %s with event %s', namespace, eventName);
            if (broadcastMetadata.includeSelf) {
              app.io.of(namespace).emit(eventName, broadcastData);
            } else {
              this.socket.broadcast.emit(eventName, broadcastData);
            }
          }
        }

        return result;
      };

      debugLog('Registering event: %s -> %s.%s', eventMetadata.event, controllerClass.name, methodName);
      routerMap.set(eventMetadata.event, handler);
    }

    app.logger.info(
      `[tegg-socket.io] Registered decorated controller: ${controllerClass.name} in namespace ${namespace} with ${events.size} events`,
    );
  }

  // After registering all controllers, set up connection listeners for each namespace
  const registeredNamespaces = new Set<string>(controllers.map(c => c.metadata.namespace || '/'));

  for (const nsPath of registeredNamespaces) {
    const nsp = ioServer.of(nsPath) as ExtendedNamespace;
    const routerMap = nsp[RouterConfigSymbol];

    if (routerMap && routerMap.size > 0) {
      nsp.on('connection', (socket: Socket) => {
        for (const [event, handler] of routerMap.entries()) {
          if (errorEvent[event]) {
            // System events (disconnect, error, disconnecting)
            socket.on(event, (...args: unknown[]) => {
              debugLog('[tegg-socket.io] socket closed: %o', args);
              const request = socket.request as unknown as ExtendedIncomingMessage & http.IncomingMessage;
              (request as ExtendedIncomingMessage).socket = socket;
              const ctx = app.createContext(request as http.IncomingMessage, new http.ServerResponse(request as http.IncomingMessage)) as unknown as SocketIOContext;
              ctx.args = args;
              Promise.resolve(handler.call(ctx as unknown as Context))
                .catch((e: Error) => {
                  e.message = '[tegg-socket.io] controller execute error: ' + e.message;
                  app.coreLogger.error(e);
                });
            });
          } else {
            // Normal events
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
      });

      debugLog('Set up connection listener for namespace: %s with %d events', nsPath, routerMap.size);
    }
  }
}

/**
 * Register middleware to app.io.middleware
 */
function registerMiddleware(
  app: Application,
  ioServer: RuntimeSocketIOServer,
  middlewareClass: Constructor,
  name: string,
  type: 'connection' | 'packet',
): void {
  const middlewareInstance = new middlewareClass() as any;

  if (typeof middlewareInstance.use !== 'function') {
    throw new Error(
      `Middleware ${middlewareClass.name} must have a "use" method with signature: ` +
      'async use(ctx: Context, next: () => Promise<void>): Promise<void>',
    );
  }

  ioServer.middleware[name] = middlewareInstance;

  debugLog('Registered %s middleware: %s as "%s"', type, middlewareClass.name, name);
  app.logger.info(`[tegg-socket.io] Registered decorated ${type} middleware: ${middlewareClass.name} as "${name}"`);
}

/**
 * Initialize decorator system
 * Uses Egg.js FileLoader to load controllers (handles TypeScript compilation),
 * then extracts decorator metadata and middleware references.
 */
export async function initializeDecoratorSystem(app: Application, ioServer: RuntimeSocketIOServer): Promise<void> {
  try {
    debugLog('Initializing decorator system...');

    // Initialize middleware object
    if (!ioServer.middleware) {
      ioServer.middleware = {};
    }

    // Load all controllers from Tegg modules using Egg.js FileLoader
    const controllers: Record<string, any> = {};
    const { FileLoader } = app.loader;
    const path = await import('node:path');
    const fs = await import('node:fs');

    // Scan app/module/*/controller directories
    const moduleDir = path.join(app.baseDir, 'app/module');
    const allControllerDirs: string[] = [];

    if (fs.existsSync(moduleDir)) {
      const modules = fs.readdirSync(moduleDir, { withFileTypes: true })
        .filter((dirent: any) => dirent.isDirectory())
        .map((dirent: any) => dirent.name);

      for (const moduleName of modules) {
        const moduleControllerDir = path.join(moduleDir, moduleName, 'controller');
        if (fs.existsSync(moduleControllerDir)) {
          allControllerDirs.push(moduleControllerDir);
          debugLog('Added module controller directory: %s', moduleControllerDir);
        }
      }
    }

    debugLog('Loading controllers from dirs: %o', allControllerDirs);
    await new FileLoader({
      directory: allControllerDirs,
      target: controllers,
      inject: app,
    }).load();

    debugLog('Loaded controller files: %o', Object.keys(controllers));

    // Extract decorated controllers and collect middleware references
    const decoratedControllers: DecoratedController[] = [];
    const middlewareRegistry = new Map<Constructor, { name: string; type: 'connection' | 'packet'; metadata: any }>();

    for (const exportedModule of Object.values(controllers)) {
      const classes = extractClasses(exportedModule);

      for (const clazz of classes) {
        if (isSocketIOController(clazz)) {
          const metadata = getSocketIOControllerMetadata(clazz)!;
          const events = getAllSocketIOEvents(clazz);

          if (events && events.size > 0) {
            debugLog(
              'Found decorated controller: %s with %d events in namespace %s',
              clazz.name,
              events.size,
              metadata.namespace,
            );

            // Collect middleware references from controller metadata
            const allMiddleware = [
              ...(metadata.connectionMiddleware || []),
              ...(metadata.packetMiddleware || []),
            ];

            for (const mw of allMiddleware) {
              if (typeof mw === 'function' && !middlewareRegistry.has(mw)) {
                if (isConnectionMiddleware(mw)) {
                  const mwMetadata = getConnectionMiddlewareMetadata(mw)!;
                  const name = mw.name.replace(/Middleware$/i, '').toLowerCase();
                  middlewareRegistry.set(mw, { name, type: 'connection', metadata: mwMetadata });
                  debugLog('Discovered connection middleware: %s (from %s)', name, clazz.name);
                } else if (isPacketMiddleware(mw)) {
                  const mwMetadata = getPacketMiddlewareMetadata(mw)!;
                  const name = mw.name.replace(/Middleware$/i, '').toLowerCase();
                  middlewareRegistry.set(mw, { name, type: 'packet', metadata: mwMetadata });
                  debugLog('Discovered packet middleware: %s (from %s)', name, clazz.name);
                }
              }
            }

            decoratedControllers.push({
              controllerClass: clazz,
              metadata,
              events,
            });
          } else {
            app.logger.warn(`[tegg-socket.io] Controller ${clazz.name} has no @SocketIOEvent methods`);
          }
        }
      }
    }

    // Register middleware first
    debugLog('Registering %d discovered middleware', middlewareRegistry.size);
    for (const [mwClass, { name, type }] of middlewareRegistry) {
      registerMiddleware(app, ioServer, mwClass, name, type);
    }

    // Then register controllers
    debugLog('Registering %d decorated controllers', decoratedControllers.length);
    await registerControllers(app, ioServer, decoratedControllers);

    debugLog('Decorator system initialized successfully');
  } catch (error) {
    app.logger.error('[tegg-socket.io] Failed to initialize decorator system:', error);
    throw error;
  }
}
