import type { Server, Socket, Namespace } from 'socket.io';
import type { Context } from 'egg';
import type { Middleware as KoaMiddleware, ComposedMiddleware } from 'koa-compose';
import type { SocketIOConfig } from './config/config.default.js';

export const RouterConfigSymbol: unique symbol = Symbol.for('TEGG-SOCKET.IO#ROUTERCONFIG');
export const CtxEventSymbol: unique symbol = Symbol.for('TEGG-SOCKET.IO#CTX-EVENT');

export type SocketIOPacket = [string, ...unknown[]];
export type RouteHandler = (this: Context, ...args: unknown[]) => unknown | Promise<unknown>;
export type SocketIOMiddleware = KoaMiddleware<Context> | (new () => KoaMiddleware<Context>) | Record<string, unknown>;
export type ComposedSocketIOMiddleware = ComposedMiddleware<Context>;
export interface ExtendedNamespace extends Namespace {
  [RouterConfigSymbol]?: Map<string, RouteHandler>;
}
export type ExtendedSocket = Socket & {
  request: ExtendedIncomingMessage;
};
export interface ExtendedIncomingMessage {
  socket?: Socket;
  args?: unknown[];
  [key: string]: unknown;
}

export type SocketIOContext = Context;
export type LoadedMiddleware = Record<string, SocketIOMiddleware>;
// LoadedController removed - controllers are now exclusively managed via decorators
export type SessionMiddleware = SocketIOMiddleware & { _name?: string };

/**
 * Runtime Socket.IO server shape used inside the plugin implementation.
 * Exposed Application/EggCore types use CustomMiddleware instead.
 * Controllers are now exclusively managed via decorators.
 */
export interface RuntimeSocketIOServer extends Server {
  middleware: LoadedMiddleware;
}

declare module 'socket.io' {
  interface Server {
    route(event: string, handler: RouteHandler): void;
  }

  interface Namespace {
    [RouterConfigSymbol]?: Map<string, RouteHandler>;
    route(event: string, handler: RouteHandler): void;
  }
}

declare module '@eggjs/core' {

  interface Context {
    /**
     * Socket.IO message arguments
     * Contains the data sent from client in socket events
     * @example
     * ```ts
     * // Client sends: socket.emit('message', { text: 'hello' })
     * // Server receives:
     * async message() {
     *   const data = this.ctx.args![0]; // { text: 'hello' }
     * }
     * ```
     */
    args?: unknown[];

    /**
     * Socket.IO socket instance
     * Available when context is created for Socket.IO events
     * @example
     * ```ts
     * async message() {
     *   const socketId = this.ctx.socket.id;
     *   this.ctx.socket.emit('response', { status: 'ok' });
     * }
     * ```
     */
    socket?: Socket;

    /**
     * Socket.IO packet data
     * Contains the raw packet information [eventName, ...args]
     */
    packet?: SocketIOPacket;

    /**
     * Internal event emitter for Socket.IO context lifecycle
     * @internal
     */
    [CtxEventSymbol]?: NodeJS.EventEmitter;

    /**
     * Extended request object with Socket.IO specific properties
     * Note: This extends the existing req property, not replaces it
     */
    req?: ExtendedIncomingMessage;
  }
}

declare module 'egg' {

  interface EggAppConfig {
    teggSocketIO: SocketIOConfig;
  }
  interface Application {
    io: SocketIOServer;
  }
  interface SocketIOServer extends Server {
    /**
     * Loaded middleware map
     * Middleware loaded from app/io/middleware/ directories
     */
    middleware: CustomMiddleware;
    /**
     * Legacy controller map populated by Egg's FileLoader.
     * Remains for backward compatibility with non-decorator apps.
     */
    controller: Record<string, unknown>;
  }

  /**
   * Custom middleware interface
   * Extend this interface in your application to add type definitions for your middleware
   * @example
   * ```ts
   * declare module 'egg' {
   *   interface CustomMiddleware {
   *     auth: AuthMiddleware;
   *     filter: FilterMiddleware;
   *   }
   * }
   * ```
   */
  interface CustomMiddleware extends Record<string, SocketIOMiddleware> {
  }
}

