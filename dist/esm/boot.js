import http from 'node:http';
import assert from 'node:assert';
import is from 'is-type-of';
import compose from 'koa-compose';
import { loadControllersAndMiddleware } from './lib/loader.js';
import { connectionMiddlewareInit } from './lib/connectionMiddlewareInit.js';
import { packetMiddlewareInit, CtxEventSymbol } from './lib/packetMiddlewareInit.js';
import { RouterConfigSymbol } from './lib/socket.io/namespace.js';
import debug from 'debug';
const debugLog = debug('egg-socket.io:lib:boot');
// System events that need special handling
const errorEvent = {
    disconnect: 1,
    error: 1,
    disconnecting: 1,
};
/**
 * Convert middleware to Koa-compatible middleware
 * This mimics egg-core's utils.middleware behavior
 * Handles function, class, and object-based middleware
 */
function toKoaMiddleware(mw) {
    if (typeof mw === 'function') {
        return mw;
    }
    // If it's a class, instantiate it
    if (is.class(mw)) {
        return new mw();
    }
    // If it's an object, return as-is (might be a factory function result)
    return mw;
}
/**
 * Socket.IO Boot Hook
 * Implements ILifecycleBoot interface for modern Tegg plugin pattern
 */
export class SocketIOBootHook {
    app;
    constructor(app) {
        this.app = app;
    }
    /**
     * Config did load hook
     * Application extension is now defined in app/extend/application.ts
     * This hook is kept for future extension logic if needed
     */
    configDidLoad() {
        // Application extension is now handled by app/extend/application.ts
        // This matches the traditional Egg.js plugin pattern
    }
    /**
     * Did load hook
     * Load controllers and middleware after all files are loaded
     */
    async didLoad() {
        // Load controllers and middleware using FileLoader pattern
        // app.io is now defined in app/extend/application.ts (loaded before boot.ts)
        // Type assertion needed because EggCore doesn't have all Application properties
        // but loadControllersAndMiddleware only needs the loader property
        loadControllersAndMiddleware(this.app);
    }
    /**
     * Will ready hook
     * Initialize namespaces and middleware before application is ready
     */
    async willReady() {
        const config = this.app.config.teggSocketIO;
        const namespace = config.namespace || {};
        debugLog('[egg-socket.io] init start!');
        // Initialize namespaces
        for (const nsp in namespace) {
            const nspConfig = namespace[nsp];
            const connectionMiddlewareConfig = nspConfig.connectionMiddleware;
            const packetMiddlewareConfig = nspConfig.packetMiddleware;
            debugLog('[egg-socket.io] connectionMiddlewareConfig: %o', connectionMiddlewareConfig);
            debugLog('[egg-socket.io] packetMiddlewareConfig: %o', packetMiddlewareConfig);
            const connectionMiddlewares = [];
            const packetMiddlewares = [];
            // Type assertion needed because CustomMiddleware doesn't have index signature in types
            // but runtime uses LoadedMiddleware which does have index signature
            const middlewareMap = this.app.io.middleware;
            if (connectionMiddlewareConfig) {
                assert(is.array(connectionMiddlewareConfig), 'config.connectionMiddleware must be Array!');
                for (const middleware of connectionMiddlewareConfig) {
                    assert(middlewareMap[middleware], `can't find middleware: ${middleware} !`);
                    connectionMiddlewares.push(middlewareMap[middleware]);
                }
            }
            if (packetMiddlewareConfig) {
                assert(is.array(packetMiddlewareConfig), 'config.packetMiddleware must be Array!');
                for (const middleware of packetMiddlewareConfig) {
                    assert(middlewareMap[middleware], `can't find middleware: ${middleware} !`);
                    packetMiddlewares.push(middlewareMap[middleware]);
                }
            }
            debugLog('[egg-socket.io] initNsp: %s', nsp);
            // Find session middleware if available
            // Type assertion needed because EggCore doesn't expose middleware array directly
            const app = this.app;
            const sessionMiddleware = (app.middleware || []).find((mw) => {
                return typeof mw === 'function' && mw._name?.startsWith('session') === true;
            });
            if (sessionMiddleware) {
                connectionMiddlewares.unshift(sessionMiddleware);
                packetMiddlewares.unshift(sessionMiddleware);
            }
            // Convert to Koa-compatible middleware and compose
            // This mimics egg-core's utils.middleware behavior
            const composedConnectionMiddlewares = compose(connectionMiddlewares.map(mw => toKoaMiddleware(mw)));
            const composedPacketMiddlewares = compose(packetMiddlewares.map(mw => toKoaMiddleware(mw)));
            debugLog('[egg-socket.io] connectionMiddlewares: %o', connectionMiddlewares);
            debugLog('[egg-socket.io] packetMiddlewares: %o', packetMiddlewares);
            this.initNsp(this.app.io.of(nsp), composedConnectionMiddlewares, composedPacketMiddlewares, app);
        }
        // Setup Redis adapter if configured
        if (config.redis) {
            // eslint-disable-next-line @typescript-eslint/no-var-requires
            const redis = require('socket.io-redis');
            const adapter = redis(config.redis);
            // https://github.com/socketio/socket.io-redis/issues/21
            adapter.prototype.on('error', (err) => {
                this.app.coreLogger.error(err);
            });
            this.app.io.adapter(adapter);
            debugLog('[egg-socket.io] init socket.io-redis ready!');
        }
        // Register server event listener for Socket.IO attachment
        // This must be registered before server is created
        // Type assertion needed because EggCore doesn't have 'on' method in types
        // but Application does, and actual instance is Application
        this.app.on('server', (server) => {
            this.app.io.attach(server, config.init);
            // Check whether it's a common function, it shouldn't be
            // an async or generator function, or it will be ignored.
            if (typeof config.generateId === 'function' &&
                !is.asyncFunction(config.generateId) &&
                !is.generatorFunction(config.generateId)) {
                this.app.io.engine.generateId = config.generateId;
            }
            debugLog('[egg-socket.io] init ready!');
        });
    }
    /**
     * Initialize namespace
     * Set up connection and packet middleware, and event handlers
     */
    initNsp(nsp, connectionMiddlewares, packetMiddlewares, app) {
        nsp.on('connection', (socket) => {
            socket.use((packet, next) => {
                packetMiddlewareInit(app, socket, packet, next, packetMiddlewares, nsp);
            });
            const routerMap = nsp[RouterConfigSymbol];
            if (routerMap) {
                for (const [event, handler] of routerMap.entries()) {
                    if (errorEvent[event]) {
                        socket.on(event, (...args) => {
                            debugLog('[egg-socket.io] socket closed: %o', args);
                            const request = socket.request;
                            request.socket = socket;
                            const ctx = app.createContext(request, new http.ServerResponse(request));
                            ctx.args = args;
                            Promise.resolve(handler.call(ctx))
                                .catch((e) => {
                                e.message = '[egg-socket.io] controller execute error: ' + e.message;
                                this.app.coreLogger.error(e);
                            });
                        });
                    }
                    else {
                        socket.on(event, (...args) => {
                            const ctx = args.splice(-1)[0];
                            ctx.args = ctx.req.args = args;
                            Promise.resolve(handler.call(ctx))
                                .then(() => {
                                ctx[CtxEventSymbol]?.emit('finshed');
                            })
                                .catch((e) => {
                                if (e instanceof Error) {
                                    e.message = '[egg-socket.io] controller execute error: ' + e.message;
                                }
                                else {
                                    debugLog(e);
                                }
                                ctx[CtxEventSymbol]?.emit('finshed', e);
                            });
                        });
                    }
                }
            }
        });
        nsp.use((socket, next) => {
            connectionMiddlewareInit(app, socket, next, connectionMiddlewares);
        });
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYm9vdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ib290LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sSUFBSSxNQUFNLFdBQVcsQ0FBQztBQUM3QixPQUFPLE1BQU0sTUFBTSxhQUFhLENBQUM7QUFDakMsT0FBTyxFQUFFLE1BQU0sWUFBWSxDQUFDO0FBTTVCLE9BQU8sT0FBTyxNQUFNLGFBQWEsQ0FBQztBQUNsQyxPQUFPLEVBQUUsNEJBQTRCLEVBQUUsTUFBTSxpQkFBaUIsQ0FBQztBQUMvRCxPQUFPLEVBQUUsd0JBQXdCLEVBQUUsTUFBTSxtQ0FBbUMsQ0FBQztBQUM3RSxPQUFPLEVBQUUsb0JBQW9CLEVBQUUsY0FBYyxFQUFFLE1BQU0sK0JBQStCLENBQUM7QUFDckYsT0FBTyxFQUFFLGtCQUFrQixFQUFFLE1BQU0sOEJBQThCLENBQUM7QUFXbEUsT0FBTyxLQUFLLE1BQU0sT0FBTyxDQUFDO0FBRTFCLE1BQU0sUUFBUSxHQUFHLEtBQUssQ0FBQyx3QkFBd0IsQ0FBQyxDQUFDO0FBRWpELDJDQUEyQztBQUMzQyxNQUFNLFVBQVUsR0FBMkI7SUFDekMsVUFBVSxFQUFFLENBQUM7SUFDYixLQUFLLEVBQUUsQ0FBQztJQUNSLGFBQWEsRUFBRSxDQUFDO0NBQ2pCLENBQUM7QUFFRjs7OztHQUlHO0FBQ0gsU0FBUyxlQUFlLENBQUMsRUFBc0I7SUFDN0MsSUFBSSxPQUFPLEVBQUUsS0FBSyxVQUFVLEVBQUUsQ0FBQztRQUM3QixPQUFPLEVBQTRCLENBQUM7SUFDdEMsQ0FBQztJQUNELGtDQUFrQztJQUNsQyxJQUFJLEVBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUNqQixPQUFPLElBQUssRUFBa0QsRUFBRSxDQUFDO0lBQ25FLENBQUM7SUFDRCx1RUFBdUU7SUFDdkUsT0FBTyxFQUF1QyxDQUFDO0FBQ2pELENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFNLE9BQU8sZ0JBQWdCO0lB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