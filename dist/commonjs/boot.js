"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SocketIOBootHook = void 0;
const node_http_1 = __importDefault(require("node:http"));
const node_assert_1 = __importDefault(require("node:assert"));
const is_type_of_1 = __importDefault(require("is-type-of"));
const koa_compose_1 = __importDefault(require("koa-compose"));
const loader_js_1 = require("./lib/loader.js");
const connectionMiddlewareInit_js_1 = require("./lib/connectionMiddlewareInit.js");
const packetMiddlewareInit_js_1 = require("./lib/packetMiddlewareInit.js");
const namespace_js_1 = require("./lib/socket.io/namespace.js");
const debug_1 = __importDefault(require("debug"));
const debugLog = (0, debug_1.default)('egg-socket.io:lib:boot');
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
    if (is_type_of_1.default.class(mw)) {
        return new mw();
    }
    // If it's an object, return as-is (might be a factory function result)
    return mw;
}
/**
 * Socket.IO Boot Hook
 * Implements ILifecycleBoot interface for modern Tegg plugin pattern
 */
class SocketIOBootHook {
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
        (0, loader_js_1.loadControllersAndMiddleware)(this.app);
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
                (0, node_assert_1.default)(is_type_of_1.default.array(connectionMiddlewareConfig), 'config.connectionMiddleware must be Array!');
                for (const middleware of connectionMiddlewareConfig) {
                    (0, node_assert_1.default)(middlewareMap[middleware], `can't find middleware: ${middleware} !`);
                    connectionMiddlewares.push(middlewareMap[middleware]);
                }
            }
            if (packetMiddlewareConfig) {
                (0, node_assert_1.default)(is_type_of_1.default.array(packetMiddlewareConfig), 'config.packetMiddleware must be Array!');
                for (const middleware of packetMiddlewareConfig) {
                    (0, node_assert_1.default)(middlewareMap[middleware], `can't find middleware: ${middleware} !`);
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
            const composedConnectionMiddlewares = (0, koa_compose_1.default)(connectionMiddlewares.map(mw => toKoaMiddleware(mw)));
            const composedPacketMiddlewares = (0, koa_compose_1.default)(packetMiddlewares.map(mw => toKoaMiddleware(mw)));
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
                !is_type_of_1.default.asyncFunction(config.generateId) &&
                !is_type_of_1.default.generatorFunction(config.generateId)) {
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
                (0, packetMiddlewareInit_js_1.packetMiddlewareInit)(app, socket, packet, next, packetMiddlewares, nsp);
            });
            const routerMap = nsp[namespace_js_1.RouterConfigSymbol];
            if (routerMap) {
                for (const [event, handler] of routerMap.entries()) {
                    if (errorEvent[event]) {
                        socket.on(event, (...args) => {
                            debugLog('[egg-socket.io] socket closed: %o', args);
                            const request = socket.request;
                            request.socket = socket;
                            const ctx = app.createContext(request, new node_http_1.default.ServerResponse(request));
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
                                ctx[packetMiddlewareInit_js_1.CtxEventSymbol]?.emit('finshed');
                            })
                                .catch((e) => {
                                if (e instanceof Error) {
                                    e.message = '[egg-socket.io] controller execute error: ' + e.message;
                                }
                                else {
                                    debugLog(e);
                                }
                                ctx[packetMiddlewareInit_js_1.CtxEventSymbol]?.emit('finshed', e);
                            });
                        });
                    }
                }
            }
        });
        nsp.use((socket, next) => {
            (0, connectionMiddlewareInit_js_1.connectionMiddlewareInit)(app, socket, next, connectionMiddlewares);
        });
    }
}
exports.SocketIOBootHook = SocketIOBootHook;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYm9vdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9ib290LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDBEQUE2QjtBQUM3Qiw4REFBaUM7QUFDakMsNERBQTRCO0FBTTVCLDhEQUFrQztBQUNsQywrQ0FBK0Q7QUFDL0QsbUZBQTZFO0FBQzdFLDJFQUFxRjtBQUNyRiwrREFBa0U7QUFXbEUsa0RBQTBCO0FBRTFCLE1BQU0sUUFBUSxHQUFHLElBQUEsZUFBSyxFQUFDLHdCQUF3QixDQUFDLENBQUM7QUFFakQsMkNBQTJDO0FBQzNDLE1BQU0sVUFBVSxHQUEyQjtJQUN6QyxVQUFVLEVBQUUsQ0FBQztJQUNiLEtBQUssRUFBRSxDQUFDO0lBQ1IsYUFBYSxFQUFFLENBQUM7Q0FDakIsQ0FBQztBQUVGOzs7O0dBSUc7QUFDSCxTQUFTLGVBQWUsQ0FBQyxFQUFzQjtJQUM3QyxJQUFJLE9BQU8sRUFBRSxLQUFLLFVBQVUsRUFBRSxDQUFDO1FBQzdCLE9BQU8sRUFBNEIsQ0FBQztJQUN0QyxDQUFDO0lBQ0Qsa0NBQWtDO0lBQ2xDLElBQUksb0JBQUUsQ0FBQyxLQUFLLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQztRQUNqQixPQUFPLElBQUssRUFBa0QsRUFBRSxDQUFDO0lBQ25FLENBQUM7SUFDRCx1RUFBdUU7SUFDdkUsT0FBTyxFQUF1QyxDQUFDO0FBQ2pELENBQUM7QUFFRDs7O0dBR0c7QUFDSCxNQUFhLGdCQUFnQjtJQUNWLEdBQUcsQ0FBVTtJQUU5QixZQUFZLEdBQVk7UUFDdEIsSUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7SUFDakIsQ0FBQztJQUVEOzs7O09BSUc7SUFDSCxhQUFhO1FBQ1gsb0VBQW9FO1FBQ3BFLHFEQUFxRDtJQUN2RCxDQUFDO0lBRUQ7OztPQUdHO0lBQ0gsS0FBSyxDQUFDLE9BQU87UUFDWCwyREFBMkQ7UUFDM0QsNkVBQTZFO1FBQzdFLGdGQUFnRjtRQUNoRixrRUFBa0U7UUFD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