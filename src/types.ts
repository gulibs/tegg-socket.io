import type { Server, Socket } from 'socket.io';
import type { RouteHandler, RouterConfigSymbol } from './lib/types.js';

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
  }

  interface Application {
    /**
     * Socket.IO server instance
     * Created lazily when first accessed
     */
    io: Server & {
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
    };
  }

  interface EggCore {
    /**
     * Socket.IO server instance
     * Created lazily when first accessed
     */
    io: Server & {
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
    };
  }
}

