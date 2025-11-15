import type { Server, Socket, Namespace } from 'socket.io';
import type { Context } from 'egg';
import type { Middleware as KoaMiddleware, ComposedMiddleware } from 'koa-compose';

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
export interface SocketIOContext extends Context {
  socket: Socket;
  args?: unknown[];
  packet?: SocketIOPacket;
  [CtxEventSymbol]?: NodeJS.EventEmitter;
  req: ExtendedIncomingMessage & Context['req'];
}
export interface LoadedMiddleware {
  [key: string]: SocketIOMiddleware;
}
export interface LoadedController {
  [key: string]: RouteHandler | { [method: string]: RouteHandler };
}
export type SessionMiddleware = SocketIOMiddleware & { _name?: string };

/**
 * Runtime Socket.IO server shape used inside the plugin implementation.
 * Exposed Application/EggCore types use CustomMiddleware/CustomController instead.
 */
export interface RuntimeSocketIOServer extends Server {
  middleware: LoadedMiddleware;
  controller: LoadedController;
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
  interface CustomMiddleware { }

  /**
   * Custom controller interface
   * Extend this interface in your application to add type definitions for your controllers
   * @example
   * ```ts
   * declare module 'egg' {
   *   interface CustomController {
   *     chat: ChatController;
   *     index: IndexController;
   *   }
   * }
   * ```
   */
  interface CustomController { }

  interface Context {
    /**
     * Socket.IO socket instance
     * Available in Socket.IO middleware and controllers
     */
    socket?: Socket;
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
  }

  interface SocketIOServer extends Server {
    /**
     * Loaded middleware map
     * Middleware loaded from app/io/middleware/ directories
     */
    middleware: CustomMiddleware;
    /**
     * Loaded controller map
     * Controllers loaded from app/io/controller/ directories
     */
    controller: CustomController;
  }

  interface Application {
    /**
     * Socket.IO server instance
     * Created lazily when first accessed
     */
    io: SocketIOServer;
  }

  interface EggCore {
    /**
     * Socket.IO server instance
     * Created lazily when first accessed
     */
    io: SocketIOServer;
  }
}

